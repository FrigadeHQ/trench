import { Injectable } from '@nestjs/common'
import { createClient, ClickHouseClient, ClickHouseError } from '@clickhouse/client'
import * as fs from 'fs'
import * as path from 'path'
import { Migration } from './clickhouse.interface'
import { md5 } from '../../../common/crypto'
import {
  DEFAULT_KAFKA_BROKERS,
  DEFAULT_KAFKA_PARTITIONS,
  DEFAULT_KAFKA_TOPIC,
  DEFAULT_WORKSPACE_ID,
  DEFAULT_WORKSPACE_NAME,
} from '../../../common/constants'

@Injectable()
export class ClickhouseService {
  private writerClient: ClickHouseClient
  private readerClient: ClickHouseClient
  constructor() {
    this.initClients()
  }

  private initClients() {
    this.writerClient = createClient({
      host: `${
        process.env.CLICKHOUSE_PROTOCOL ?? 'http'
      }://${process.env.CLICKHOUSE_USER}:${process.env.CLICKHOUSE_PASSWORD}@${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT}`,
    })
    this.readerClient = createClient({
      host: `${
        process.env.CLICKHOUSE_PROTOCOL ?? 'http'
      }://${process.env.CLICKHOUSE_READONLY_USER ?? process.env.CLICKHOUSE_USER}:${process.env.CLICKHOUSE_READONLY_PASSWORD ?? process.env.CLICKHOUSE_PASSWORD}@${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT}`,
    })
  }

  private applySubstitutions(sql: string) {
    const kafkaBrokerList = process.env.KAFKA_BROKERS ?? DEFAULT_KAFKA_BROKERS
    const kafkaTopicList = process.env.KAFKA_TOPIC ?? DEFAULT_KAFKA_TOPIC
    const kafkaInstanceId = md5(kafkaBrokerList + kafkaTopicList).slice(0, 6)
    const kafkaPartitions = process.env.KAFKA_PARTITIONS ?? DEFAULT_KAFKA_PARTITIONS

    return sql
      .replaceAll('{kafka_brokers}', kafkaBrokerList)
      .replaceAll('{kafka_topic}', kafkaTopicList)
      .replaceAll('{kafka_instance_id}', kafkaInstanceId)
      .replaceAll('{kafka_partitions}', kafkaPartitions.toString())
  }

  async runMigrations() {
    const migrationsDir = path.join(__dirname, '../../../resources/migrations')
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort()

    // Create the _migrations table if it doesn't exist
    await this.writerClient.query({
      query: `
      CREATE TABLE IF NOT EXISTS _migrations (
        name String,
        checksum String,
        executed_at DateTime DEFAULT now()
      ) ENGINE = MergeTree()
      ORDER BY executed_at
    `,
    })

    // Get the list of already executed migrations
    const executedMigrations = (await this.writerClient
      .query({
        query: `
        SELECT * FROM _migrations
      `,
      })
      .then((resultSet) => resultSet.json().then((json) => json.data))) as unknown as Migration[]

    const executedFiles = new Set(executedMigrations.map((migration) => migration.name))

    for (const file of files) {
      if (executedFiles.has(file)) {
        console.log(`Skipping migration ${file}, already executed `)
        continue
      }

      console.log(`Executing migration ${file}`)

      const filePath = path.join(migrationsDir, file)
      const query = this.applySubstitutions(fs.readFileSync(filePath, 'utf8'))
      const queries = query.split(';')
      for (const query of queries) {
        if (query.trim() === '') {
          continue
        }
        try {
          await this.writerClient.query({
            query,
          })
        } catch (error) {
          // if the error is a duplicate table or column error, we can ignore it
          if (String(error).includes('already exists')) {
            continue
          }
          console.error(`Error executing migration ${file} with query ${query}: ${error}`)
          throw error
        }
      }
      await this.insert('_migrations', [
        {
          name: file,
          checksum: md5(query),
        },
      ])

      console.log(`Migration ${file} executed successfully`)
    }

    // Check if default workspace exists
    let defaultWorkspace = await this.query(
      `SELECT * FROM workspaces WHERE name = '${DEFAULT_WORKSPACE_NAME}'`
    )
    if (defaultWorkspace.length === 0) {
      await this.insert('workspaces', [
        {
          workspace_id: DEFAULT_WORKSPACE_ID,
          name: DEFAULT_WORKSPACE_NAME,
          is_default: true,
        },
      ])
    }

    defaultWorkspace = await this.query(
      `SELECT * FROM workspaces WHERE name = '${DEFAULT_WORKSPACE_NAME}'`
    )

    const defaultWorkspaceId = defaultWorkspace[0].workspace_id

    const publicApiKeys = process.env.PUBLIC_API_KEYS?.split(',') || []
    const privateApiKeys = process.env.PRIVATE_API_KEYS?.split(',') || []

    const existingApiKeys = await this.query(
      `SELECT * FROM api_keys WHERE workspace_id = '${defaultWorkspaceId}'`
    )

    for (const publicKey of publicApiKeys) {
      if (!existingApiKeys.find((key) => key.key === publicKey)) {
        await this.insert('api_keys', [
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
        await this.insert('api_keys', [
          {
            workspace_id: defaultWorkspaceId, // Use the ID directly instead of a subquery
            key: privateKey,
            type: 'private',
          },
        ])
      }
    }
  }

  async query(query: string): Promise<any> {
    const result = await this.readerClient.query({ query })
    return result.json().then((json) => json.data)
  }

  async execute(query: string): Promise<any> {
    await this.writerClient.query({ query })
  }

  async insert(table: string, values: Record<string, any>[]): Promise<void> {
    await this.writerClient.insert({
      table,
      values,
      format: 'JSONEachRow',
    })
  }
}
