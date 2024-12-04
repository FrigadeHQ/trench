import { Injectable } from '@nestjs/common'
import { EventDTO, EventsQuery, PaginatedEventResponse } from './events.interface'
import { EventsDao } from './events.dao'
import { Event } from './events.interface'
import { Workspace } from '../workspaces/workspaces.interface'

@Injectable()
export class EventsService {
  constructor(private eventsDao: EventsDao) {}

  async createEvents(workspace: Workspace, eventDTOs: EventDTO[]): Promise<Event[]> {
    // validate event types
    const validEventTypes = ['page', 'track', 'identify', 'group']
    eventDTOs.forEach((eventDTO) => {
      if (!validEventTypes.includes(eventDTO.type)) {
        throw new Error(
          `Invalid event type: ${eventDTO.type}. Valid types are ${validEventTypes.join(', ')}.`
        )
      }
    })

    return this.eventsDao.createEvents(workspace, eventDTOs)
  }

  async getEventsByUUIDs(workspace: Workspace, uuids: string[]): Promise<Event[]> {
    return this.eventsDao.getEventsByUUIDs(workspace, uuids)
  }

  async getEventsByQuery(
    workspace: Workspace,
    query: EventsQuery
  ): Promise<PaginatedEventResponse> {
    return this.eventsDao.getEventsByQuery(workspace, query)
  }
}
