import { Injectable } from '@nestjs/common'
import { ClickhouseService } from '../services/data/clickhouse/clickhouse.service'
import { escapeString } from '../services/data/clickhouse/clickhouse.util'
import { Cache } from '@nestjs/cache-manager'
import { Inject } from '@nestjs/common'

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly clickhouseService: ClickhouseService,
    @Inject(Cache) private cacheManager: Cache
  ) {}

  async validateApiKey(apiKey: string, type: 'public' | 'private'): Promise<boolean> {
    const cacheKey = `validate_api_key:${apiKey}:${type}`
    const cached = await this.cacheManager.get<boolean>(cacheKey)

    if (cached !== undefined) {
      return cached
    }

    const result = await this.clickhouseService.query(`
      SELECT COUNT(*) as count 
      FROM api_keys 
      WHERE key = '${escapeString(apiKey)}' AND type = '${escapeString(type)}'
    `)
    const isValid = result[0].count > 0 ? 'is-valid' : 'is-invalid'

    await this.cacheManager.set(cacheKey, isValid, 120000) // Cache for 2 minutes
    return isValid === 'is-valid'
  }

  async getWorkspaceIdFromApiKey(
    apiKey: string,
    type: 'public' | 'private'
  ): Promise<string | null> {
    const cacheKey = `workspace_id:${apiKey}:${type}`
    const cached = await this.cacheManager.get<string | null>(cacheKey)

    if (cached !== undefined) {
      return cached
    }

    const result = await this.clickhouseService.query(`
      SELECT workspace_id
      FROM api_keys
      WHERE key = '${escapeString(apiKey)}' AND type = '${escapeString(type)}'
      LIMIT 1
    `)
    const workspaceId = result.length > 0 ? result[0].workspace_id : null

    await this.cacheManager.set(cacheKey, workspaceId, 120000) // Cache for 2 minutes
    return workspaceId
  }
}
