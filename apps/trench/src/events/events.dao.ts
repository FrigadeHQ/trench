import { Injectable } from '@nestjs/common'
import { ClickhouseService } from '../services/data/clickhouse/clickhouse.service'
import { escapeString } from '../services/data/clickhouse/clickhouse.util'
import { Event } from './events.interface'

@Injectable()
export class EventsDao {
  constructor(private readonly clickhouse: ClickhouseService) {}

  async getEventsByUUIDs(uuids: string[]): Promise<Event[]> {
    const escapedUUIDs = uuids.map((uuid) => `'${escapeString(uuid)}'`).join(', ')
    const query = `SELECT * FROM events WHERE uuid IN (${escapedUUIDs})`
    const result = await this.clickhouse.query(query)
    return result.map((row: any) => ({
      uuid: row.uuid,
      type: row.type,
      event: row.event,
      userId: row.user_id,
      groupId: row.group_id,
      anonymousId: row.anonymous_id,
      properties: row.properties,
      traits: row.traits,
      context: row.context,
      timestamp: new Date(row.timestamp),
      parsedAt: new Date(row.parsed_at),
    }))
  }
}
