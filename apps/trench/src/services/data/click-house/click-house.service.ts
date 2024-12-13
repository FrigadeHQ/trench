import { Injectable, Logger } from '@nestjs/common'
import { createClient, ClickHouseClient } from '@clickhouse/client'
import * as fs from 'fs'
import * as path from 'path'
import { Migration } from 'src/services/data/click-house/click-house.interface'
import { md5 } from 'src/common/crypto'
import {
  DEFAULT_KAFKA_BROKERS,
  DEFAULT_KAFKA_PARTITIONS,
  DEFAULT_KAFKA_TOPIC,
} from 'src/common/constants'

@Injectable()
export class ClickHouseService {
  private readonly logger = new Logger(ClickHouseService.name)
  private clientMap: Map<string, ClickHouseClient> = new Map()

  getClient(databaseName?: string): ClickHouseClient {
    if (!databaseName) {
      databaseName = process.env.CLICKHOUSE_DATABASE
    }

    if (!this.clientMap.has(databaseName)) {
      this.clientMap.set(
        databaseName,
        createClient({
          host: `${
            process.env.CLICKHOUSE_PROTOCOL ?? 'http'
          }://${process.env.CLICKHOUSE_USER}:${process.env.CLICKHOUSE_PASSWORD}@${process.env.CLICKHOUSE_HOST}:${process.env.CLICKHOUSE_PORT}`,
          database: databaseName,
        })
      )
    }

    return this.clientMap.get(databaseName)
  }

  private applySubstitutions(sql: string, kafkaTopicName?: string) {
    const kafkaBrokerList = process.env.KAFKA_BROKERS ?? DEFAULT_KAFKA_BROKERS
    const kafkaTopicList = kafkaTopicName ?? process.env.KAFKA_TOPIC ?? DEFAULT_KAFKA_TOPIC
    const kafkaInstanceId = md5(kafkaBrokerList + kafkaTopicList).slice(0, 6)
    const kafkaPartitions = process.env.KAFKA_PARTITIONS ?? DEFAULT_KAFKA_PARTITIONS

    return sql
      .replaceAll('{kafka_brokers}', kafkaBrokerList)
      .replaceAll('{kafka_topic}', kafkaTopicList)
      .replaceAll('{kafka_instance_id}', kafkaInstanceId)
      .replaceAll('{kafka_partitions}', kafkaPartitions.toString())
  }

  async runMigrations(databaseName?: string, kafkaTopicName?: string) {
    if (!databaseName) {
      databaseName = process.env.CLICKHOUSE_DATABASE
    }

    const migrationsDir = path.join(__dirname, '../../../resources/migrations')
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort()

    // Create the _migrations table if it doesn't exist
    await this.getClient(databaseName).query({
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
    const executedMigrations = (await this.getClient(databaseName)
      .query({
        query: `
        SELECT * FROM _migrations
      `,
      })
      .then((resultSet) => resultSet.json().then((json) => json.data))) as unknown as Migration[]

    const executedFiles = new Set(executedMigrations.map((migration) => migration.name))

    for (const file of files) {
      if (executedFiles.has(file)) {
        this.logger.log(`Skipping migration ${file}, already executed `)
        continue
      }

      this.logger.log(`Executing migration ${file}`)

      const filePath = path.join(migrationsDir, file)
      const query = this.applySubstitutions(fs.readFileSync(filePath, 'utf8'), kafkaTopicName)
      const queries = query.split(';')
      for (const query of queries) {
        if (query.trim() === '') {
          continue
        }
        try {
          await this.getClient(databaseName).query({
            query,
          })
        } catch (error) {
          // if the error is a duplicate table or column error, we can ignore it
          if (String(error).includes('already exists')) {
            continue
          }
          this.logger.error(`Error executing migration ${file} with query ${query}: ${error}`, error.stack)
          throw error
        }
      }
      await this.insert('_migrations', [
        {
          name: file,
          checksum: md5(query),
        },
      ])

      this.logger.log(`Migration ${file} executed successfully`)
    }
  }

  async queryResults(query: string, databaseName?: string): Promise<any> {
    const result = await this.getClient(databaseName).query({ query })
    return result.json().then((json) => json.data)
  }

  async query(query: string, databaseName?: string): Promise<any> {
    await this.getClient(databaseName).query({ query })
  }

  async command(query: string, databaseName?: string): Promise<void> {
    await this.getClient(databaseName).command({ query })
  }

  async insert(table: string, values: Record<string, any>[], databaseName?: string): Promise<void> {
    await this.getClient(databaseName).insert({
      table,
      values,
      format: 'JSONEachRow',
    })
  }
}
