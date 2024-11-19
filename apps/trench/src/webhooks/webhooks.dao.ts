import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { ClickHouseService } from '../services/data/click-house/click-house.service'
import { Webhook, WebhookDTO } from './webhooks.interface'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

const CACHE_KEY = 'webhooks'
@Injectable()
export class WebhooksDao {
  constructor(
    private readonly clickhouse: ClickHouseService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async getWebhooks(): Promise<Webhook[]> {
    const cachedWebhooks = await this.cacheManager.get<Webhook[]>(CACHE_KEY)
    if (cachedWebhooks) {
      return cachedWebhooks
    }
    const query = 'SELECT * FROM webhooks'
    const result = await this.clickhouse.queryResults(query)
    const resultData = result.map((row: any) => ({
      uuid: row.uuid,
      url: row.url,
      enableBatching: row.enable_batching,
      createdAt: new Date(row.created_at),
      eventTypes: row.event_types,
      eventNames: row.event_names,
    }))
    await this.cacheManager.set(CACHE_KEY, resultData)
    return resultData
  }

  async createWebhook(webhookDTO: WebhookDTO): Promise<Webhook> {
    if (!webhookDTO.url) {
      throw new BadRequestException('URL is required to create a webhook')
    }

    await this.clickhouse.insert('webhooks', [
      {
        url: webhookDTO.url,
        enable_batching: webhookDTO.enableBatching ?? false,
        event_types: webhookDTO.eventTypes ?? ['*'],
        event_names: webhookDTO.eventNames ?? ['*'],
      },
    ])
    await this.cacheManager.del(CACHE_KEY)

    return {
      uuid: 'new-webhook',
      url: webhookDTO.url,
      enableBatching: webhookDTO.enableBatching ?? false,
      createdAt: new Date(),
      eventTypes: webhookDTO.eventTypes ?? ['*'],
      eventNames: webhookDTO.eventNames ?? ['*'],
    }
  }

  async deleteWebhook(uuid: string): Promise<void> {
    await this.clickhouse.query(`ALTER TABLE webhooks DELETE WHERE uuid = '${uuid}'`)
    await this.cacheManager.del(CACHE_KEY)
  }
}
