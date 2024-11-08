import { Event } from './events.interface'

export function mapRowToEvent(row: any): Event {
  return {
    workspaceId: row.workspace_id,
    uuid: row.uuid,
    type: row.type,
    event: row.event,
    userId: row.user_id,
    groupId: row.group_id ? row.group_id : undefined,
    anonymousId: row.anonymous_id ? row.anonymous_id : undefined,
    instanceId: row.instance_id ? row.instance_id : undefined,
    properties: row.properties
      ? typeof row.properties === 'string'
        ? JSON.parse(row.properties)
        : row.properties
      : undefined,
    traits: row.traits
      ? typeof row.traits === 'string'
        ? JSON.parse(row.traits)
        : row.traits
      : undefined,
    context: row.context
      ? typeof row.context === 'string'
        ? JSON.parse(row.context)
        : row.context
      : undefined,
    timestamp: new Date(row.timestamp),
    parsedAt: new Date(row.parsed_at),
  }
}
