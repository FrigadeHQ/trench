import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { EventsService } from './events.service'

import { EventsDTO } from './events.interface'
import { PublicApiGuard } from '../middlewares/public-api.guard'

@ApiBearerAuth()
@ApiTags('events')
@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @ApiOperation({ summary: 'Create one or more events' })
  @ApiResponse({
    status: 200,
    description: 'The events have been successfully created.',
  })
  @Post('/events')
  @UseGuards(PublicApiGuard)
  async createEvents(@Request() request: Request, @Body() eventDTOs: EventsDTO): Promise<void> {
    await this.eventsService.createEvents(eventDTOs.events)
  }
}
