import { Injectable } from '@nestjs/common'
import { Kafka, Producer } from 'kafkajs'
import { KafkaEventWithUUID } from './kafka.interface'
import { DEFAULT_KAFKA_CLIENT_ID, DEFAULT_KAFKA_PARTITIONS } from '../../../common/constants'

@Injectable()
export class KafkaService {
  private hasConnectedToProducer = false

  async createTopicsIfNotExists() {
    try {
      await this.createTopic(
        process.env.KAFKA_TOPIC,
        process.env.KAFKA_PARTITIONS
          ? Number(process.env.KAFKA_PARTITIONS)
          : DEFAULT_KAFKA_PARTITIONS
      )
      console.log(`Created topic ${process.env.KAFKA_TOPIC}`)
    } catch (e) {
      console.log(`Skipping topic creation, topic ${process.env.KAFKA_TOPIC} already exists.`)
    }
  }
  private kafka: Kafka
  private producer: Producer

  constructor() {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID ?? DEFAULT_KAFKA_CLIENT_ID,
      brokers: process.env.KAFKA_BROKERS.split(','),
    })
    this.producer = this.kafka.producer()
    this.connectToProducer()
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
    eachBatch: (payloads: any[]) => Promise<void>,
    enableBatching: boolean = false
  ) {
    const consumer = this.kafka.consumer({ groupId })
    await consumer.connect()
    await consumer.subscribe({ topic, fromBeginning: false })

    if (enableBatching) {
      await consumer.run({
        eachBatch: async ({ batch }) => {
          await eachBatch(batch.messages.map((message) => JSON.parse(message.value.toString())))
          await consumer.commitOffsets(
            batch.messages.map((message) => ({
              topic: batch.topic,
              partition: batch.partition,
              offset: message.offset,
            }))
          )
        },
      })
    } else {
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          await eachBatch([JSON.parse(message.value.toString())])
          await consumer.commitOffsets([{ topic, partition, offset: message.offset }])
        },
      })
    }
  }

  async removeConsumer(groupId: string) {
    try {
      const consumer = this.kafka.consumer({ groupId })
      await consumer.disconnect()
      console.log(`Consumer with groupId ${groupId} has been removed.`)
    } catch (e) {
      console.log(`Consumer with groupId ${groupId} not found.`, e)
    }
  }
}
