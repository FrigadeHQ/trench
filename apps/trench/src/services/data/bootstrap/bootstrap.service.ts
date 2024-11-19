import { Injectable } from '@nestjs/common'
import { ClickHouseService } from '../click-house/click-house.service'
import { KafkaService } from '../kafka/kafka.service'
import { DEFAULT_WORKSPACE_ID } from '../../../common/constants'
import { DEFAULT_WORKSPACE_NAME } from '../../../common/constants'
import { getKafkaTopicFromWorkspace } from '../kafka/kafka.util'
import { mapRowToWorkspace } from '../../../workspaces/workspaces.util'
import { Workspace } from '../../../workspaces/workspaces.interface'

@Injectable()
export class BootstrapService {
  constructor(
    private readonly clickhouseService: ClickHouseService,
    private readonly kafkaService: KafkaService
  ) {}

  async bootstrap() {
    // This creates everything needed for the default workspace
    await this.kafkaService.createTopicIfNotExists()
    await this.clickhouseService.runMigrations()
    await this.createDefaultRecordsIfNotExist()
    // This creates creates any maintains any additional workspaces kafka topics and tables
    const additionalWorkspacesResult = await this.clickhouseService.queryResults(`
      SELECT * FROM workspaces
    `)
    const additionalWorkspaces = additionalWorkspacesResult.map(mapRowToWorkspace)

    for (const workspace of additionalWorkspaces) {
      if (workspace.isDefault) {
        continue
      }
      await this.bootstrapWorkspace(workspace)
    }
  }

  async bootstrapWorkspace(workspace: Workspace) {
    console.log(`Creating topics and running migrations for workspace ${workspace.name}`)
    const kafkaTopicName = await this.kafkaService.createTopicIfNotExists(
      getKafkaTopicFromWorkspace(workspace)
    )
    await this.clickhouseService.runMigrations(workspace.databaseName, kafkaTopicName)
    console.log(
      `Successfully finished creating topics and running migrations for workspace ${workspace.name}`
    )
  }

  private async createDefaultRecordsIfNotExist() {
    // Check if default workspace exists
    let defaultWorkspace = await this.clickhouseService.queryResults(
      `SELECT * FROM workspaces WHERE name = '${DEFAULT_WORKSPACE_NAME}'`
    )
    if (defaultWorkspace.length === 0) {
      await this.clickhouseService.insert('workspaces', [
        {
          workspace_id: DEFAULT_WORKSPACE_ID,
          name: DEFAULT_WORKSPACE_NAME,
          is_default: true,
          database_name: process.env.CLICKHOUSE_DATABASE,
        },
      ])
    }

    defaultWorkspace = await this.clickhouseService.queryResults(
      `SELECT * FROM workspaces WHERE name = '${DEFAULT_WORKSPACE_NAME}'`
    )

    const defaultWorkspaceId = defaultWorkspace[0].workspace_id

    const publicApiKeys = process.env.PUBLIC_API_KEYS?.split(',') || []
    const privateApiKeys = process.env.PRIVATE_API_KEYS?.split(',') || []

    const existingApiKeys = await this.clickhouseService.queryResults(
      `SELECT * FROM api_keys WHERE workspace_id = '${defaultWorkspaceId}'`
    )

    for (const publicKey of publicApiKeys) {
      if (!existingApiKeys.find((key) => key.key === publicKey)) {
        await this.clickhouseService.insert('api_keys', [
          {
            workspace_id: defaultWorkspaceId,
            key: publicKey,
            type: 'public',
          },
        ])
      }
    }

    for (const privateKey of privateApiKeys) {
      if (!existingApiKeys.find((key) => key.key === privateKey)) {
        await this.clickhouseService.insert('api_keys', [
          {
            workspace_id: defaultWorkspaceId, // Use the ID directly instead of a subquery
            key: privateKey,
            type: 'admin',
          },
          {
            workspace_id: defaultWorkspaceId,
            key: privateKey,
            type: 'private',
          },
        ])
      }
    }
  }
}
