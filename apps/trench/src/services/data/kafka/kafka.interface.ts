export class KafkaEvent {
  uuid: string
  event?: string
  type: string
  user_id?: string
  group_id?: string
  anonymous_id?: string
  properties?: Record<string, any>
  traits?: Record<string, any>
  context?: Record<string, any>
  timestamp: Date
}

export class KafkaEventWithUUID {
  uuid: string
  value: KafkaEvent
}
