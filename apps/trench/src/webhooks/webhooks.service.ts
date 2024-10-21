import { Injectable, OnModuleInit } from '@nestjs/common'
import { KafkaService } from '../services/data/kafka/kafka.service'
import { WebhooksDao } from './webhooks.dao'
import { DEFAULT_KAFKA_TOPIC } from '../common/constants'
import { KafkaEvent, KafkaEventWithUUID } from '../services/data/kafka/kafka.interface'
import { Webhook, WebhookDTO } from './webhooks.interface'

import { EventsService } from '../events/events.service'
import { Event } from '../events/events.interface'
@Injectable()
export class WebhooksService implements OnModuleInit {
  constructor(
    private readonly webhooksDao: WebhooksDao,
    private readonly kafkaService: KafkaService,
    private readonly eventsService: EventsService
  ) {}

  async onModuleInit() {
    console.log('Starting Kafka consumers... this might take a while...')
    const webhooks = await this.webhooksDao.getWebhooks()
    for (const webhook of webhooks) {
      console.log('Initiating consumer for webhook', webhook.uuid)
      // if (process.env.NODE_ENV === 'production') {
      await this.initiateConsumer(webhook)
      // }
    }
    // This call takes a while, so we don't block in development!
    console.log('Kafka consumer successfully started!')
  }

  private getGroupId(webhookUUID: string) {
    return `${webhookUUID.substring(0, 6)}-webhook-group`
  }

  async initiateConsumer(webhook: Webhook) {
    await this.kafkaService.initiateConsumer(
      process.env.KAFKA_TOPIC ?? DEFAULT_KAFKA_TOPIC,
      this.getGroupId(webhook.uuid),
      (payloads) => this.processMessages(payloads, webhook.uuid),
      webhook.enableBatching
    )
  }

  async processMessages(payloads: KafkaEvent[], webhookUUID: string) {
    const webhooks = await this.webhooksDao.getWebhooks()
    const thisWebhook = webhooks.find((webhook) => webhook.uuid === webhookUUID)

    if (!thisWebhook) {
      await this.kafkaService.removeConsumer(this.getGroupId(webhookUUID))
      console.error(`Webhook not found. Removing consumer for ${webhookUUID}.`)
      return
    }

    const maxRetries = 4
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
    const numberOfEventsToFind = payloads.length
    let retries = 0

    let eventsFound: Event[] = []

    while (eventsFound.length < numberOfEventsToFind && retries < maxRetries) {
      const events = await this.eventsService.getEventsByUUIDs(
        payloads.map((payload) => payload.uuid)
      )
      if (events.length > 0) {
        eventsFound = eventsFound.concat(events)
      } else {
        retries++
        const backoffTime = Math.pow(2, retries) * 1000 // Exponential backoff
        await delay(backoffTime)
      }
    }

    if (eventsFound.length < numberOfEventsToFind) {
      console.error(`Not all events found after ${maxRetries} retries for webhook ${webhookUUID}.`)
    }

    if (eventsFound.length > 0) {
      await this.sendWebhook(thisWebhook, eventsFound)
    }
  }

  async sendWebhook(webhook: Webhook, events: Event[]) {
    try {
      await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // TODO: Add type here
        body: JSON.stringify({
          data: events,
        }),
      })
    } catch (error) {
      console.error('Error sending webhook:', error.message)
    }
  }

  async getWebhooks(): Promise<Webhook[]> {
    return await this.webhooksDao.getWebhooks()
  }

  async createWebhook(webhookDTO: WebhookDTO) {
    const newWebhook = await this.webhooksDao.createWebhook(webhookDTO)
    await this.initiateConsumer(newWebhook)
    return
  }

  async deleteWebhook(uuid: string) {
    await this.webhooksDao.deleteWebhook(uuid)
  }
}
