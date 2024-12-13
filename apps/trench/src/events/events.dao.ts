import { BadRequestException, Injectable } from '@nestjs/common'
import { ClickHouseService } from 'src/services/data/click-house/click-house.service'
import { escapeString, formatToClickhouseDate } from 'src/services/data/click-house/click-house.util'
import { Event, EventDTO, EventsQuery, PaginatedEventResponse } from 'src/events/events.interface'
import { KafkaService } from 'src/services/data/kafka/kafka.service'
import { KafkaEventWithUUID } from 'src/services/data/kafka/kafka.interface'
import { v4 as uuidv4 } from 'uuid'
import { mapRowToEvent } from 'src/events/events.util'
import { Workspace } from 'src/workspaces/workspaces.interface'
import { getKafkaTopicFromWorkspace } from 'src/services/data/kafka/kafka.util'
import { isReadOnlyQuery } from 'src/queries/queries.util'

@Injectable()
export class EventsDao {
  constructor(
    private readonly clickhouse: ClickHouseService,
    private kafkaService: KafkaService
  ) {}

  async getEventsByUUIDs(workspace: Workspace, uuids: string[]): Promise<Event[]> {
    const escapedUUIDs = uuids.map((uuid) => `'${escapeString(uuid)}'`).join(', ')
    const query = `SELECT * FROM events WHERE uuid IN (${escapedUUIDs})`
    const result = await this.clickhouse.queryResults(query, workspace.databaseName)
    return result.map((row: any) => mapRowToEvent(row))
  }

  async getEventsByQuery(
    workspace: Workspace,
    query: EventsQuery
  ): Promise<PaginatedEventResponse> {
    const {
      uuid,
      event,
      userId,
      groupId,
      anonymousId,
      instanceId,
      properties,
      traits,
      context,
      startDate,
      endDate,
      limit,
      offset,
      orderByField,
      orderByDirection,
    } = query

    const maxRecords = Math.min(limit ?? 1000, 1000)

    let conditions = []

    if (event) {
      conditions.push(`event = '${escapeString(event)}'`)
    }
    if (userId) {
      conditions.push(`user_id = '${escapeString(userId)}'`)
    }
    if (groupId) {
      conditions.push(`group_id = '${escapeString(groupId)}'`)
    }
    if (anonymousId) {
      conditions.push(`anonymous_id = '${escapeString(anonymousId)}'`)
    }
    if (instanceId) {
      conditions.push(`instance_id = '${escapeString(instanceId)}'`)
    }
    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        conditions.push(`JSONExtract(properties, '${key}', 'String') = '${escapeString(value)}'`)
      }
    }
    if (traits) {
      for (const [key, value] of Object.entries(traits)) {
        conditions.push(`JSONExtract(traits, '${key}', 'String') = '${escapeString(value)}'`)
      }
    }
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        conditions.push(`JSONExtract(context, '${key}', 'String') = '${escapeString(value)}'`)
      }
    }
    if (startDate) {
      conditions.push(`timestamp >= '${escapeString(formatToClickhouseDate(new Date(startDate)))}'`)
    }
    if (endDate) {
      conditions.push(`timestamp <= '${escapeString(formatToClickhouseDate(new Date(endDate)))}'`)
    }
    if (uuid) {
      conditions.push(`uuid = '${escapeString(uuid)}'`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const orderByClause =
      orderByField && orderByDirection
        ? `ORDER BY ${escapeString(orderByField)} ${escapeString(orderByDirection)}`
        : 'ORDER BY timestamp DESC'
    const limitClause = `LIMIT ${maxRecords}`
    const offsetClause = offset ? `OFFSET ${offset}` : ''

    const clickhouseQuery = `SELECT * FROM events ${whereClause} ${orderByClause} ${limitClause} ${offsetClause}`
    if (!isReadOnlyQuery(clickhouseQuery)) {
      throw new BadRequestException('The provided query is not read-only')
    }
    const totalQuery = `SELECT COUNT(*) AS count FROM events ${whereClause}`

    try {
      const [result, total] = await Promise.all([
        this.clickhouse.queryResults(clickhouseQuery, workspace.databaseName),
        this.clickhouse.queryResults(totalQuery, workspace.databaseName),
      ])
      const results = result.map((row: any) => mapRowToEvent(row))
      const totalCount = +total[0].count

      return {
        results: results,
        limit: maxRecords,
        offset: +offset || 0,
        total: totalCount,
      }
    } catch (error) {
      throw new BadRequestException(`Error querying events: ${error.message}`)
    }
  }

  async createEvents(workspace: Workspace, eventDTOs: EventDTO[]): Promise<Event[]> {
    const records: KafkaEventWithUUID[] = eventDTOs.map((eventDTO) => {
      const uuid = uuidv4()
      const row = {
        instance_id: eventDTO.instanceId,
        uuid,
        event: eventDTO.event,
        type: eventDTO.type,
        user_id: eventDTO.userId,
        group_id: eventDTO.groupId,
        anonymous_id: eventDTO.anonymousId,
        properties: eventDTO.properties,
        traits: eventDTO.traits,
        context: eventDTO.context,
        timestamp: eventDTO.timestamp ? new Date(eventDTO.timestamp) : new Date(),
      }
      return {
        uuid,
        value: row,
      }
    })

    this.kafkaService.produceEvents(getKafkaTopicFromWorkspace(workspace), records)

    return records.map((record) => mapRowToEvent(record.value))
  }
}
