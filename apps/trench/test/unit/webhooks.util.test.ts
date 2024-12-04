import { shouldProcessEvent } from '../../src/webhooks/webhooks.util'
import { KafkaEvent } from '../../src/services/data/kafka/kafka.interface'
import { Webhook } from '../../src/webhooks/webhooks.interface'

describe('shouldProcessEvent', () => {
  const mockEvent: KafkaEvent = {
    instance_id: 'test-instance',
    uuid: '123',
    type: 'track',
    event: 'button_clicked',
    timestamp: new Date(),
  }

  const mockWebhook: Webhook = {
    uuid: '456',
    url: 'http://test.com',
    enableBatching: false,
    createdAt: new Date(),
    eventTypes: ['track'],
    eventNames: ['button_clicked'],
    flatten: false,
  }

  it('should return true when event type and name match exactly', () => {
    expect(shouldProcessEvent(mockEvent, mockWebhook)).toBe(true)
  })

  it('should return true when webhook has wildcard event type', () => {
    const wildcardWebhook = {
      ...mockWebhook,
      eventTypes: ['*'],
    }
    expect(shouldProcessEvent(mockEvent, wildcardWebhook)).toBe(true)
  })

  it('should return true when webhook has wildcard event name', () => {
    const wildcardWebhook = {
      ...mockWebhook,
      eventNames: ['*'],
    }
    expect(shouldProcessEvent(mockEvent, wildcardWebhook)).toBe(true)
  })

  it('should return false when event type does not match', () => {
    const differentTypeWebhook = {
      ...mockWebhook,
      eventTypes: ['page'],
    }
    expect(shouldProcessEvent(mockEvent, differentTypeWebhook)).toBe(false)
  })

  it('should return false when event name does not match', () => {
    const differentNameWebhook = {
      ...mockWebhook,
      eventNames: ['form_submitted'],
    }
    expect(shouldProcessEvent(mockEvent, differentNameWebhook)).toBe(false)
  })

  it('should return true when both type and name use wildcards', () => {
    const allWildcardWebhook = {
      ...mockWebhook,
      eventTypes: ['*'],
      eventNames: ['*'],
    }
    expect(shouldProcessEvent(mockEvent, allWildcardWebhook)).toBe(true)
  })
})
