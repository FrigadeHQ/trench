import { Injectable } from '@nestjs/common'
import { EventDTO, EventsQuery, PaginatedEventResponse } from './events.interface'
import { KafkaService } from '../services/data/kafka/kafka.service'
import { v4 as uuidv4 } from 'uuid'
import { KafkaEventWithUUID } from '../services/data/kafka/kafka.interface'
import { EventsDao } from './events.dao'
import { Event } from './events.interface'

@Injectable()
export class EventsService {
  constructor(private eventsDao: EventsDao) {}

  async createEvents(eventDTOs: EventDTO[]): Promise<Event[]> {
    return this.eventsDao.createEvents(eventDTOs)
  }

  async getEventsByUUIDs(uuids: string[]): Promise<Event[]> {
    return this.eventsDao.getEventsByUUIDs(uuids)
  }

  async getEventsByQuery(query: EventsQuery): Promise<PaginatedEventResponse> {
    return this.eventsDao.getEventsByQuery(query)
  }
}
