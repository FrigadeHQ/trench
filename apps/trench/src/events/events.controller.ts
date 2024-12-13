import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { EventsService } from 'src/events/events.service'

import { EventsDTO, EventsQuery, PaginatedEventResponse } from 'src/events/events.interface'
import { PublicApiGuard } from 'src/middlewares/public-api.guard'
import { PrivateApiGuard } from 'src/middlewares/private-api.guard'
import { getWorkspace } from 'src/common/request'

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
    const workspace = getWorkspace(request)
    const events = await this.eventsService.createEvents(workspace, eventDTOs.events)
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
    const workspace = getWorkspace(request)
    return this.eventsService.getEventsByQuery(workspace, query)
  }
}
