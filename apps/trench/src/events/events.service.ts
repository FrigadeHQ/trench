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

  async createEvents(workspaceId: string, eventDTOs: EventDTO[]): Promise<Event[]> {
    // validate event types
    const validEventTypes = ['track', 'identify', 'group']
    eventDTOs.forEach((eventDTO) => {
      if (!validEventTypes.includes(eventDTO.type)) {
        throw new Error(
          `Invalid event type: ${eventDTO.type}. Valid types are ${validEventTypes.join(', ')}.`
        )
      }
    })

    return this.eventsDao.createEvents(workspaceId, eventDTOs)
  }

  async getEventsByUUIDs(uuids: string[]): Promise<Event[]> {
    return this.eventsDao.getEventsByUUIDs(uuids)
  }

  async getEventsByQuery(workspaceId: string, query: EventsQuery): Promise<PaginatedEventResponse> {
    return this.eventsDao.getEventsByQuery(workspaceId, query)
  }
}
