import { Injectable } from '@nestjs/common'
import { ClickhouseService } from '../services/data/clickhouse/clickhouse.service'
import { escapeString } from '../services/data/clickhouse/clickhouse.util'

@Injectable()
export class ApiKeysService {
  constructor(private readonly clickhouseService: ClickhouseService) {}

  async validateApiKey(apiKey: string, type: 'public' | 'private'): Promise<boolean> {
    const result = await this.clickhouseService.query(`
      SELECT COUNT(*) as count 
      FROM api_keys 
      WHERE key = '${escapeString(apiKey)}' AND type = '${escapeString(type)}'
    `)
    return result[0].count > 0
  }

  async getWorkspaceIdFromApiKey(
    apiKey: string,
    type: 'public' | 'private'
  ): Promise<string | null> {
    const result = await this.clickhouseService.query(`
      SELECT workspace_id
      FROM api_keys
      WHERE key = '${escapeString(apiKey)}' AND type = '${escapeString(type)}'
      LIMIT 1
    `)
    return result.length > 0 ? result[0].workspace_id : null
  }
}
