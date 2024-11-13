import { BadRequestException, Injectable } from '@nestjs/common'
import { ClickhouseService } from '../services/data/clickhouse/clickhouse.service'
import { CreateWorkspaceDto, Workspace, WorkspaceCreationResult } from './workspaces.interface'
import { escapeString } from '../services/data/clickhouse/clickhouse.util'
import { v4 as uuidv4 } from 'uuid'
import { ApiKeysService } from '../api-keys/api-keys.service'
@Injectable()
export class WorkspacesService {
  constructor(
    private readonly clickhouseService: ClickhouseService,
    private readonly apiKeysService: ApiKeysService
  ) {}

  async createNewWorkspace(
    createWorkspaceDto: CreateWorkspaceDto
  ): Promise<WorkspaceCreationResult> {
    let { name, databaseName, isDefault } = createWorkspaceDto

    name = (name ?? '').trim()

    if (!name) {
      throw new BadRequestException('Workspace name is required')
    }

    const uuid = uuidv4()

    if (!databaseName) {
      databaseName = `trench_workspace_${name
        .replace(/[^a-zA-Z-_]/g, '')
        .toLowerCase()
        .replace(/[\s-]+/g, '_')}`
    }

    const existingWorkspace = await this.getWorkspaceByName(name)

    if (existingWorkspace) {
      throw new BadRequestException('Workspace name already taken')
    }

    // create the database
    try {
      await this.clickhouseService.command(
        `CREATE DATABASE IF NOT EXISTS ${escapeString(databaseName)};`
      )
    } catch (error) {
      throw new BadRequestException(
        `Failed to create database ${databaseName} for workspace ${name}: ${error}`
      )
    }

    await this.clickhouseService.insert('workspaces', [
      {
        workspace_id: uuid,
        name,
        database_name: databaseName,
        is_default: isDefault,
      },
    ])

    const privateApiKey = await this.apiKeysService.createApiKey(uuid, 'private')
    const publicApiKey = await this.apiKeysService.createApiKey(uuid, 'public')

    return {
      ...(await this.getWorkspaceById(uuid)),
      privateApiKey,
      publicApiKey,
    }
  }

  async getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
    const result = await this.clickhouseService.query(`
      SELECT *
      FROM workspaces
      WHERE workspace_id = '${escapeString(workspaceId)}'
    `)

    if (!result || result.length === 0) {
      return null
    }

    return this.parseWorkspace(result[0])
  }

  async getWorkspaceByName(name: string): Promise<Workspace | null> {
    const result = await this.clickhouseService.query(`
      SELECT *
      FROM workspaces
      WHERE name = '${escapeString(name)}'
    `)

    if (!result || result.length === 0) {
      return null
    }

    return this.parseWorkspace(result[0])
  }

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
      databaseName: result.database_name,
      createdAt: result.created_at,
    }
  }
}
