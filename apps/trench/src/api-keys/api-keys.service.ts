import { Injectable } from '@nestjs/common'
import { ClickhouseService } from '../services/data/clickhouse/clickhouse.service'
import { escapeString } from '../services/data/clickhouse/clickhouse.util'
import { Cache } from '@nestjs/cache-manager'
import { Inject } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { ApiKeyType } from './api-keys.interface'
import { Workspace } from '../workspaces/workspaces.interface'
import { mapRowToWorkspace } from '../workspaces/workspaces.util'
@Injectable()
export class ApiKeysService {
  constructor(
    private readonly clickhouseService: ClickhouseService,
    @Inject(Cache) private cacheManager: Cache
  ) {}

  async validateApiKey(apiKey: string, type: ApiKeyType): Promise<boolean> {
    const cacheKey = `validate_api_key:${apiKey}:${type}`
    const cached = await this.cacheManager.get<boolean>(cacheKey)

    if (cached !== undefined) {
      return cached
    }

    const result = await this.clickhouseService.queryResults(`
      SELECT COUNT(*) as count 
      FROM api_keys 
      WHERE key = '${escapeString(apiKey)}' AND type = '${escapeString(type)}'
    `)
    const isValid = result[0].count > 0 ? 'is-valid' : 'is-invalid'

    await this.cacheManager.set(cacheKey, isValid, 120000) // Cache for 2 minutes
    return isValid === 'is-valid'
  }

  async createApiKey(workspaceId: string, type: ApiKeyType): Promise<string> {
    const apiKey = `${type}-${uuidv4()}`

    await this.clickhouseService.insert('api_keys', [
      {
        workspace_id: workspaceId,
        key: apiKey,
        type,
      },
    ])

    return apiKey
  }

  async getWorkspaceFromApiKey(apiKey: string, type: ApiKeyType): Promise<Workspace | null> {
    const cacheKey = `workspace_id:${apiKey}:${type}`
    const cached = await this.cacheManager.get<Workspace | null>(cacheKey)

    if (cached !== undefined) {
      return cached
    }

    const result = await this.clickhouseService.queryResults(`
      SELECT workspace_id
      FROM api_keys
      WHERE key = '${escapeString(apiKey)}' AND type = '${escapeString(type)}'
      LIMIT 1
    `)
    const workspaceId = result.length > 0 ? result[0].workspace_id : null
    if (!workspaceId) {
      return null
    }
    const workspaceResult = await this.clickhouseService.queryResults(`
      SELECT * FROM workspaces WHERE workspace_id = '${workspaceId}'
    `)
    const workspace = mapRowToWorkspace(workspaceResult[0])

    await this.cacheManager.set(cacheKey, workspace, 120000) // Cache for 2 minutes
    return workspace
  }
}
