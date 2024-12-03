import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common'
import { WebhooksService } from './webhooks.service'
import { PaginatedWebhookResponse, Webhook, WebhookDTO } from './webhooks.interface'
import { PrivateApiGuard } from '../middlewares/private-api.guard'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { PaginatedResponse } from '../common/models'
import { getWorkspace } from '../common/request'

@ApiBearerAuth()
@Controller('webhooks')
@UseGuards(PrivateApiGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all webhooks' })
  @ApiResponse({
    status: 200,
    description:
      'The webhooks have been successfully retrieved. Requires private API key in Bearer token.',
    type: PaginatedWebhookResponse,
  })
  async getWebhooks(@Request() request: Request): Promise<PaginatedWebhookResponse> {
    const workspace = getWorkspace(request)
    const result = await this.webhooksService.getWebhooks(workspace)
    return {
      results: result,
      limit: 0,
      offset: 0,
      total: result.length,
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a webhook' })
  @ApiResponse({
    status: 200,
    description:
      'The webhook has been successfully created. Requires private API key in Bearer token.',
    type: Webhook,
  })
  async createWebhook(@Request() request: Request, @Body() webhookDTO: WebhookDTO) {
    const workspace = getWorkspace(request)
    return this.webhooksService.createWebhook(workspace, webhookDTO)
  }

  @Delete(':uuid')
  @ApiOperation({ summary: 'Delete a webhook' })
  @ApiResponse({
    status: 200,
    description:
      'The webhook has been successfully deleted. Requires private API key in Bearer token.',
  })
  async deleteWebhook(@Request() request: Request, @Param('uuid') uuid: string) {
    const workspace = getWorkspace(request)
    return this.webhooksService.deleteWebhook(workspace, uuid)
  }
}
