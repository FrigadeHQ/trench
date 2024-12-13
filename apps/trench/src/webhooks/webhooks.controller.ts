import { Controller, Get, Post, Delete, Put, Body, Param, UseGuards, Request } from '@nestjs/common'
import { WebhooksService } from 'src/webhooks/webhooks.service'
import { PaginatedWebhookResponse, Webhook, WebhookDTO } from 'src/webhooks/webhooks.interface'
import { PrivateApiGuard } from 'src/middlewares/private-api.guard'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { PaginatedResponse } from 'src/common/models'
import { getWorkspace } from 'src/common/request'

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

  @Put(':uuid')
  @ApiOperation({ summary: 'Update a webhook' })
  @ApiResponse({
    status: 200,
    description:
      'The webhook has been successfully updated. Requires private API key in Bearer token.',
    type: Webhook,
  })
  async updateWebhook(
    @Request() request: Request,
    @Param('uuid') uuid: string,
    @Body() webhookDTO: WebhookDTO
  ) {
    const workspace = getWorkspace(request)
    return this.webhooksService.updateWebhook(workspace, uuid, webhookDTO)
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
