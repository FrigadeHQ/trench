import { BadRequestException, Injectable } from '@nestjs/common'
import { ClickHouseService } from '../services/data/click-house/click-house.service'
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  Workspace,
  WorkspaceCreationResult,
} from './workspaces.interface'
import { escapeString } from '../services/data/click-house/click-house.util'
import { v4 as uuidv4 } from 'uuid'
import { ApiKeysService } from '../api-keys/api-keys.service'
import { mapRowToWorkspace, mapWorkspaceToRow } from './workspaces.util'
import { BootstrapService } from '../services/data/bootstrap/bootstrap.service'
@Injectable()
export class WorkspacesService {
  constructor(
    private readonly clickhouseService: ClickHouseService,
    private readonly apiKeysService: ApiKeysService,
    private readonly bootstrapService: BootstrapService
  ) {}

  async createNewWorkspace(
    createWorkspaceDto: CreateWorkspaceDto
  ): Promise<WorkspaceCreationResult> {
    let { name, databaseName, isDefault, properties } = createWorkspaceDto
    this.validateInputs(name, createWorkspaceDto.properties)

    name = (name ?? '').trim()

    const uuid = uuidv4()

    if (!databaseName) {
      databaseName = `trench_workspace_${name
        .replace(/[^a-zA-Z0-9-_]/g, '')
        .toLowerCase()
        .replace(/[\s-]+/g, '_')}`
    }

    const existingWorkspace = await this.getWorkspaceByName(name)

    if (existingWorkspace) {
      throw new BadRequestException(`Workspace name '${name}' already taken`)
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
        properties: JSON.stringify(properties),
      },
    ])

    const privateApiKey = await this.apiKeysService.createApiKey(uuid, 'private')
    const publicApiKey = await this.apiKeysService.createApiKey(uuid, 'public')

    const workspace = await this.getWorkspaceById(uuid)

    await this.bootstrapService.bootstrapWorkspace(workspace)

    return {
      ...workspace,
      privateApiKey,
      publicApiKey,
    }
  }

  async getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
    const result = await this.clickhouseService.queryResults(`
      SELECT *
      FROM workspaces
      WHERE workspace_id = '${escapeString(workspaceId)}'
    `)

    if (!result || result.length === 0) {
      return null
    }

    return mapRowToWorkspace(result[0])
  }

  async getWorkspaceByName(name: string): Promise<Workspace | null> {
    const result = await this.clickhouseService.queryResults(`
      SELECT *
      FROM workspaces
      WHERE name = '${escapeString(name)}'
    `)

    if (!result || result.length === 0) {
      return null
    }

    return mapRowToWorkspace(result[0])
  }

  async getDefaultWorkspace(): Promise<Workspace> {
    const query = `
      SELECT *
      FROM workspaces 
      WHERE is_default = true
      ORDER BY created_at ASC 
      LIMIT 1
    `
    const result = await this.clickhouseService.queryResults(query)

    if (!result || result.length === 0) {
      throw new Error('No workspace found')
    }

    return mapRowToWorkspace(result[0])
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    const query = `
      DELETE FROM workspaces
      WHERE workspace_id = '${escapeString(workspaceId)}'
    `
    await this.clickhouseService.command(query)
  }

  async updateWorkspace(
    workspaceId: string,
    updateWorkspaceDto: UpdateWorkspaceDto
  ): Promise<Workspace> {
    this.validateInputs(updateWorkspaceDto.name, updateWorkspaceDto.properties)

    const existingWorkspace = await this.getWorkspaceById(workspaceId)
    if (!existingWorkspace) {
      throw new Error('Workspace not found')
    }

    const { name, properties } = updateWorkspaceDto
    const updatedWorkspace = {
      ...existingWorkspace,
      name: name || existingWorkspace.name,
      properties: properties || existingWorkspace.properties,
    }

    await this.deleteWorkspace(workspaceId)

    await this.clickhouseService.insert('workspaces', [mapWorkspaceToRow(updatedWorkspace)])

    return updatedWorkspace
  }

  private validateInputs(name?: string, properties?: Record<string, any>) {
    if (!name || name.trim().length === 0) {
      throw new BadRequestException('Workspace name is required')
    }

    if (properties && typeof properties !== 'object') {
      throw new BadRequestException('Properties must be a valid JSON object')
    }
  }
}
