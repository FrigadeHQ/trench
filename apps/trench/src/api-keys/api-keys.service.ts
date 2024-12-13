import { Injectable } from '@nestjs/common'
import { ClickHouseService } from 'src/services/data/click-house/click-house.service'
import { escapeString } from 'src/services/data/click-house/click-house.util'
import { Cache } from '@nestjs/cache-manager'
import { Inject } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { ApiKeyType } from 'src/api-keys/api-keys.interface'
import { Workspace } from 'src/workspaces/workspaces.interface'
import { mapRowToWorkspace } from 'src/workspaces/workspaces.util'
const IS_VALID_API_KEY_STRING = 'is-valid'
const IS_INVALID_API_KEY_STRING = 'is-invalid'
@Injectable()
export class ApiKeysService {
  constructor(
    private readonly clickhouseService: ClickHouseService,
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
    const isValid = result[0].count > 0 ? IS_VALID_API_KEY_STRING : IS_INVALID_API_KEY_STRING

    await this.cacheManager.set(cacheKey, isValid, 120000) // Cache for 2 minutes
    return isValid === IS_VALID_API_KEY_STRING
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
