import { Injectable } from '@nestjs/common'
import { ClickhouseService } from '../services/data/clickhouse/clickhouse.service'
import { escapeString } from '../services/data/clickhouse/clickhouse.util'
import { Event, EventDTO, EventsQuery, PaginatedEventResponse } from './events.interface'
import { KafkaService } from '../services/data/kafka/kafka.service'
import { KafkaEventWithUUID } from '../services/data/kafka/kafka.interface'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class EventsDao {
  constructor(
    private readonly clickhouse: ClickhouseService,
    private kafkaService: KafkaService
  ) {}

  async getEventsByUUIDs(uuids: string[]): Promise<Event[]> {
    const escapedUUIDs = uuids.map((uuid) => `'${escapeString(uuid)}'`).join(', ')
    const query = `SELECT * FROM events WHERE uuid IN (${escapedUUIDs})`
    const result = await this.clickhouse.query(query)
    return result.map((row: any) => this.mapRowToEvent(row))
  }

  async getEventsByQuery(query: EventsQuery): Promise<PaginatedEventResponse> {
    const {
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
      conditions.push(`timestamp >= '${escapeString(new Date(startDate).toISOString())}'`)
    }
    if (endDate) {
      conditions.push(`timestamp <= '${escapeString(new Date(endDate).toISOString())}'`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const limitClause = `LIMIT ${maxRecords}`
    const offsetClause = offset ? `OFFSET ${offset}` : ''

    const clickhouseQuery = `SELECT * FROM events ${whereClause} ${limitClause} ${offsetClause}`

    console.log(clickhouseQuery)
    const result = await this.clickhouse.query(clickhouseQuery)
    const results = result.map((row: any) => this.mapRowToEvent(row))
    const total = results.length

    return {
      results: results,
      limit: limit,
      offset: offset,
      total: null,
    }
  }

  async createEvents(eventDTOs: EventDTO[]): Promise<void> {
    const records: KafkaEventWithUUID[] = eventDTOs.map((eventDTO) => {
      const uuid = uuidv4()
      return {
        uuid,
        value: {
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
          instance_id: eventDTO.instanceId,
        },
      }
    })

    this.kafkaService.produceEvents(process.env.KAFKA_TOPIC, records)
  }

  private mapRowToEvent(row: any): Event {
    return {
      uuid: row.uuid,
      type: row.type,
      event: row.event,
      userId: row.user_id,
      groupId: row.group_id,
      anonymousId: row.anonymous_id,
      instanceId: row.instance_id,
      properties: row.properties,
      traits: row.traits,
      context: row.context,
      timestamp: new Date(row.timestamp),
      parsedAt: new Date(row.parsed_at),
    }
  }
}
