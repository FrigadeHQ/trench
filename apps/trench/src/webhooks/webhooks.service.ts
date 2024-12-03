import { Injectable, OnModuleInit } from '@nestjs/common'
import { KafkaService } from '../services/data/kafka/kafka.service'
import { WebhooksDao } from './webhooks.dao'
import { DEFAULT_KAFKA_TOPIC } from '../common/constants'
import { KafkaEvent } from '../services/data/kafka/kafka.interface'
import { Webhook, WebhookDTO } from './webhooks.interface'

import { EventsService } from '../events/events.service'
import { Event } from '../events/events.interface'
import { flatten } from '../common/utils'
import { Workspace } from '../workspaces/workspaces.interface'
import { WorkspacesService } from '../workspaces/workspaces.service'
import { getKafkaTopicFromWorkspace } from '../services/data/kafka/kafka.util'
@Injectable()
export class WebhooksService implements OnModuleInit {
  constructor(
    private readonly webhooksDao: WebhooksDao,
    private readonly kafkaService: KafkaService,
    private readonly eventsService: EventsService,
    private readonly workspacesService: WorkspacesService
  ) {}

  async onModuleInit() {
    console.log('Starting Kafka consumers... this might take a while...')
    const workspaces = await this.workspacesService.getWorkspaces()
    for (const workspace of workspaces) {
      const webhooks = await this.webhooksDao.getWebhooks(workspace)
      for (const webhook of webhooks) {
        console.log('Initiating consumer for webhook:', webhook.uuid, webhook.url)
        this.initiateConsumer(webhook, workspace)
          .then(() => {
            console.log(`Consumer for webhook ${webhook.uuid} has been initiated.`)
          })
          .catch((e) => {
            console.error(`Error initiating consumer for webhook ${webhook.uuid}.`, e)
          })
      }
    }
  }

  private getGroupId(webhookUUID: string) {
    return `${webhookUUID.substring(0, 6)}-webhook-group`
  }

  async initiateConsumer(webhook: Webhook, workspace: Workspace) {
    await this.kafkaService.initiateConsumer(
      getKafkaTopicFromWorkspace(workspace),
      this.getGroupId(webhook.uuid),
      (payloads) => this.processMessages(payloads, webhook.uuid, workspace),
      webhook.enableBatching
    )
  }

  async processMessages(payloads: KafkaEvent[], webhookUUID: string, workspace: Workspace) {
    const webhooks = await this.webhooksDao.getWebhooks(workspace)
    const thisWebhook = webhooks.find((webhook) => webhook.uuid === webhookUUID)

    if (!thisWebhook) {
      await this.kafkaService.removeConsumer(this.getGroupId(webhookUUID))
      console.error(`Webhook not found. Removing consumer for ${webhookUUID}.`)
      return
    }

    const maxRetries = 8
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
    const numberOfEventsToFind = payloads.length
    let retries = 0

    let eventsFound: Event[] = []

    while (eventsFound.length < numberOfEventsToFind && retries < maxRetries) {
      const events = await this.eventsService.getEventsByUUIDs(
        workspace,
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
      console.error(
        `Error: Not all events found after ${maxRetries} retries for webhook ${webhookUUID}.`
      )
    }

    if (eventsFound.length > 0) {
      await this.sendWebhook(thisWebhook, eventsFound)
    }
  }

  async sendWebhook(webhook: Webhook, events: Event[]) {
    try {
      const payload = {
        data: events,
      }
      await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhook.flatten ? flatten(payload) : payload),
      })
    } catch (error) {
      console.error('Error sending webhook:', error.message)
    }
  }

  async getWebhooks(workspace: Workspace): Promise<Webhook[]> {
    return await this.webhooksDao.getWebhooks(workspace)
  }

  async createWebhook(workspace: Workspace, webhookDTO: WebhookDTO) {
    const newWebhook = await this.webhooksDao.createWebhook(workspace, webhookDTO)
    await this.initiateConsumer(newWebhook, workspace)
    return
  }

  async deleteWebhook(workspace: Workspace, uuid: string) {
    await this.webhooksDao.deleteWebhook(workspace, uuid)
  }
}
