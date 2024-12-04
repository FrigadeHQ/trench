import { KafkaEvent } from '../services/data/kafka/kafka.interface'
import { Webhook } from './webhooks.interface'

export function shouldProcessEvent(event: KafkaEvent, webhook: Webhook): boolean {
  const typeMatches = webhook.eventTypes.includes('*') || webhook.eventTypes.includes(event.type)
  if (!typeMatches) {
    return false
  }

  const nameMatches = webhook.eventNames.includes('*') || webhook.eventNames.includes(event.event)
  if (!nameMatches) {
    return false
  }

  return true
}
