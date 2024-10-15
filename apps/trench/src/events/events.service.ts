import { Injectable } from '@nestjs/common'
import { EventDTO } from './events.interface'
import { KafkaService } from '../services/data/kafka/kafka.service'
import { v4 as uuidv4 } from 'uuid'
import { KafkaEventWithUUID } from '../services/data/kafka/kafka.interface'
import { EventsDao } from './events.dao'
import { Event } from './events.interface'

@Injectable()
export class EventsService {
  constructor(
    private kafkaService: KafkaService,
    private eventsDao: EventsDao
  ) {}

  async handleEvents(eventDTOs: EventDTO[]): Promise<void> {
    const records: KafkaEventWithUUID[] = eventDTOs.map((eventDTO) => {
      const uuid = uuidv4()
      return {
        uuid,
        value: {
          uuid,
          event: eventDTO.event,
          type: eventDTO.type,
          user_id: eventDTO.userId,
          group_id: eventDTO.groupId,
          anonymous_id: eventDTO.anonymousId,
          properties: eventDTO.properties,
          traits: eventDTO.traits,
          context: eventDTO.context,
          timestamp: eventDTO.timestamp ? new Date(eventDTO.timestamp) : new Date(),
        },
      }
    })

    this.kafkaService.produceEvents(process.env.KAFKA_TOPIC, records)
  }

  async getEventsByUUIDs(uuids: string[]): Promise<Event[]> {
    return this.eventsDao.getEventsByUUIDs(uuids)
  }
}
