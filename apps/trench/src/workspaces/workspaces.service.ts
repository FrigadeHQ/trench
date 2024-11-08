import { Injectable } from '@nestjs/common'
import { ClickhouseService } from '../services/data/clickhouse/clickhouse.service'
import { Workspace } from './workspaces.interface'

@Injectable()
export class WorkspacesService {
  constructor(private readonly clickhouseService: ClickhouseService) {}

  async getDefaultWorkspace(): Promise<Workspace> {
    const query = `
      SELECT *
      FROM workspaces 
      WHERE is_default = true
      ORDER BY created_at ASC 
      LIMIT 1
    `
    const result = await this.clickhouseService.query(query)

    if (!result || result.length === 0) {
      throw new Error('No workspace found')
    }

    return this.parseWorkspace(result[0])
  }

  private parseWorkspace(result: any): Workspace {
    return {
      workspaceId: result.workspace_id,
      name: result.name,
      isDefault: result.is_default,
      createdAt: result.created_at,
    }
  }
}
