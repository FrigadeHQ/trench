import { KafkaEvent } from 'src/services/data/kafka/kafka.interface'
import { Webhook } from 'src/webhooks/webhooks.interface'

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
