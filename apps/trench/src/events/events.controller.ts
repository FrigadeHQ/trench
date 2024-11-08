import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { EventsService } from './events.service'

import { EventsDTO, EventsQuery, PaginatedEventResponse } from './events.interface'
import { PublicApiGuard } from '../middlewares/public-api.guard'
import { PrivateApiGuard } from '../middlewares/private-api.guard'
import { getWorkspaceId } from '../common/request'

@ApiBearerAuth()
@ApiTags('events')
@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @ApiOperation({ summary: 'Create one or more events. Requires public API key in Bearer token.' })
  @ApiResponse({
    status: 201,
    description: 'The events have been successfully created.',
  })
  @Post('/events')
  @UseGuards(PublicApiGuard)
  async createEvents(
    @Request() request: Request,
    @Body() eventDTOs: EventsDTO
  ): Promise<PaginatedEventResponse> {
    const workspaceId = getWorkspaceId(request)
    const events = await this.eventsService.createEvents(workspaceId, eventDTOs.events)
    return {
      results: events,
      limit: eventDTOs.events.length,
      offset: 0,
      total: events.length,
    }
  }

  @ApiOperation({
    summary: 'Get events based on a query. Requires private API key in Bearer token.',
  })
  @ApiResponse({
    status: 200,
    description: 'The events have been successfully retrieved.',
    type: PaginatedEventResponse,
  })
  @Get('/events')
  @UseGuards(PrivateApiGuard)
  async getEvents(
    @Request() request: Request,
    @Query() query: EventsQuery
  ): Promise<PaginatedEventResponse> {
    const workspaceId = getWorkspaceId(request)
    return this.eventsService.getEventsByQuery(workspaceId, query)
  }
}
