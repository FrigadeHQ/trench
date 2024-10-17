import { Injectable } from '@nestjs/common'
import { ClickhouseService } from '../services/data/clickhouse/clickhouse.service'
import { escapeString } from '../services/data/clickhouse/clickhouse.util'
import { Event, EventDTO } from './events.interface'
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
