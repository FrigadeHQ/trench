import { Injectable, Logger } from '@nestjs/common'
import { Consumer, Kafka, Producer } from 'kafkajs'
import { KafkaEventWithUUID } from 'src/services/data/kafka/kafka.interface'
import { DEFAULT_KAFKA_CLIENT_ID, DEFAULT_KAFKA_PARTITIONS } from 'src/common/constants'

@Injectable()
export class KafkaService {
  private readonly logger = new Logger(KafkaService.name)
  private hasConnectedToProducer = false
  private kafka: Kafka
  private producer: Producer

  constructor() {
    const sslEnabled = (process.env.KAFKA_SSL_ENABLED ?? '').toLowerCase() === 'true'
    const sslRejectUnauthorizedEnv = (process.env.KAFKA_SSL_REJECT_UNAUTHORIZED ?? '').toLowerCase()
    const sslRejectUnauthorized = sslRejectUnauthorizedEnv
      ? sslRejectUnauthorizedEnv === 'true'
      : true

    const hasSslMaterial = Boolean(
      process.env.KAFKA_SSL_CA || process.env.KAFKA_SSL_CERT || process.env.KAFKA_SSL_KEY
    )

    const sslConfig = sslEnabled
      ? hasSslMaterial
        ? {
            rejectUnauthorized: sslRejectUnauthorized,
            ca: process.env.KAFKA_SSL_CA ? [process.env.KAFKA_SSL_CA] : undefined,
            cert: process.env.KAFKA_SSL_CERT || undefined,
            key: process.env.KAFKA_SSL_KEY || undefined,
          }
        : true
      : undefined

    const saslMechanism = (process.env.KAFKA_SASL_MECHANISM ?? '').toLowerCase()
    const hasSaslCreds = Boolean(
      saslMechanism && process.env.KAFKA_SASL_USERNAME && process.env.KAFKA_SASL_PASSWORD
    )

    const saslConfig = hasSaslCreds
      ? {
          mechanism: saslMechanism as any, // 'plain' | 'scram-sha-256' | 'scram-sha-512'
          username: process.env.KAFKA_SASL_USERNAME,
          password: process.env.KAFKA_SASL_PASSWORD,
        }
      : undefined

    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID ?? DEFAULT_KAFKA_CLIENT_ID,
      brokers: process.env.KAFKA_BROKERS.split(','),
      ssl: sslConfig,
      sasl: saslConfig,
    })
    this.producer = this.kafka.producer()
    this.connectToProducer()
  }

  async createTopicIfNotExists(topic?: string) {
    if (!topic) {
      topic = process.env.KAFKA_TOPIC
    }
    try {
      const topicPromise = this.createTopic(
        topic,
        process.env.KAFKA_PARTITIONS
          ? Number(process.env.KAFKA_PARTITIONS)
          : DEFAULT_KAFKA_PARTITIONS
      ).then(() => this.logger.log(`Created topic ${topic}`))

      if (process.env.NODE_ENV !== 'development') {
        await topicPromise
      }
    } catch (e) {
      this.logger.log(`Skipping topic creation, topic ${process.env.KAFKA_TOPIC} already exists.`)
    }

    return topic
  }

  private async connectToProducer() {
    if (this.hasConnectedToProducer) {
      return
    }
    await this.producer.connect()
    this.hasConnectedToProducer = true
  }

  async createTopic(topic: string, partitions: number) {
    const admin = this.kafka.admin()
    await admin.connect()
    await admin.createTopics({
      topics: [{ topic, numPartitions: partitions, replicationFactor: 1 }],
    })
    await admin.disconnect()
  }

  async produceEvents(topic: string, events: KafkaEventWithUUID[]) {
    await this.connectToProducer()
    await this.producer.send({
      topic,
      messages: events.map((record) => ({
        key: record.uuid,
        value: JSON.stringify(record.value),
      })),
    })
  }

  async initiateConsumer(
    topic: string,
    groupId: string,
    eachBatch: (payloads: any[], consumer: Consumer) => Promise<void>,
    enableBatching: boolean = false
  ) {
    const consumer = this.kafka.consumer({ groupId })
    await consumer.connect()
    await consumer.subscribe({ topic, fromBeginning: false })

    try {
      await consumer.run({
        eachBatch: async ({ batch }) => {
          if (enableBatching) {
            // Process all messages in batch at once
            await eachBatch(
              batch.messages.map((message) => JSON.parse(message.value.toString())),
              consumer
            )
          } else {
            // Process messages one at a time
            for (const message of batch.messages) {
              await eachBatch([JSON.parse(message.value.toString())], consumer)
            }
          }
        },
        autoCommit: true,
        autoCommitInterval: 1000,
        partitionsConsumedConcurrently: 4,
      })
    } catch (e) {
      this.logger.log(`Error initiating consumer for groupId ${groupId}.`, e)
    }
  }
}
