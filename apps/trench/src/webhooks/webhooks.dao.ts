import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { ClickHouseService } from 'src/services/data/click-house/click-house.service'
import { Webhook, WebhookDTO } from 'src/webhooks/webhooks.interface'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { v4 as uuidv4 } from 'uuid'
import { Workspace } from 'src/workspaces/workspaces.interface'
const CACHE_KEY = 'webhooks'
@Injectable()
export class WebhooksDao {
  constructor(
    private readonly clickhouse: ClickHouseService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  getCacheKey(workspace: Workspace): string {
    return `${CACHE_KEY}_${workspace.workspaceId}`
  }

  async getWebhooks(workspace: Workspace): Promise<Webhook[]> {
    const cacheKey = this.getCacheKey(workspace)
    const cachedWebhooks = await this.cacheManager.get<Webhook[]>(cacheKey)
    if (cachedWebhooks) {
      return cachedWebhooks
    }
    const query = 'SELECT * FROM webhooks'
    const result = await this.clickhouse.queryResults(query, workspace.databaseName)
    const resultData = result.map((row: any) => ({
      uuid: row.uuid,
      url: row.url,
      enableBatching: row.enable_batching,
      createdAt: new Date(row.created_at),
      eventTypes: row.event_types,
      eventNames: row.event_names,
      flatten: row.flatten,
    }))
    await this.cacheManager.set(cacheKey, resultData, 60000) // Cache for 1 minute
    return resultData
  }

  async createWebhook(
    workspace: Workspace,
    webhookDTO: WebhookDTO,
    existingUuid?: string
  ): Promise<Webhook> {
    if (!webhookDTO.url) {
      throw new BadRequestException('URL is required to create a webhook')
    }

    const uuid = existingUuid ?? uuidv4()
    await this.clickhouse.insert(
      'webhooks',
      [
        {
          uuid,
          url: webhookDTO.url,
          enable_batching: webhookDTO.enableBatching ?? false,
          event_types: webhookDTO.eventTypes ?? ['*'],
          event_names: webhookDTO.eventNames ?? ['*'],
          flatten: webhookDTO.flatten ?? false,
        },
      ],
      workspace.databaseName
    )
    await this.cacheManager.del(this.getCacheKey(workspace))

    return {
      uuid,
      url: webhookDTO.url,
      enableBatching: webhookDTO.enableBatching ?? false,
      createdAt: new Date(),
      eventTypes: webhookDTO.eventTypes ?? ['*'],
      eventNames: webhookDTO.eventNames ?? ['*'],
      flatten: webhookDTO.flatten ?? false,
    }
  }

  async deleteWebhook(workspace: Workspace, uuid: string): Promise<void> {
    await this.clickhouse.query(
      `ALTER TABLE webhooks DELETE WHERE uuid = '${uuid}'`,
      workspace.databaseName
    )
    await this.cacheManager.del(this.getCacheKey(workspace))
  }
}
