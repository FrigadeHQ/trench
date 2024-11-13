import { ApiProperty } from '@nestjs/swagger'
import { PaginatedResponse } from '../common/models'

export class Webhook {
  @ApiProperty({
    description: 'The UUID of the webhook. Automatically generated.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  uuid: string

  @ApiProperty({
    description: 'The URL that the webhook will send events to.',
    example: 'https://your-webhook-url.com',
  })
  url: string

  @ApiProperty({
    description: 'Whether to enable batching for the webhook.',
    example: true,
  })
  enableBatching: boolean

  @ApiProperty({
    description: 'The date and time the webhook was created.',
    example: '2021-01-01T00:00:00.000Z',
  })
  createdAt: Date

  @ApiProperty({
    description: 'The event types that the webhook will send. Use `*` to match all event types.',
    example: ['page', 'track', 'identify', 'group'],
  })
  eventTypes: string[]

  @ApiProperty({
    description: 'The event names that the webhook will send. Use `*` to match all event names.',
    example: ['UserSignedUp', 'UserLoggedIn'],
  })
  eventNames: string[]
}

export class WebhookDTO {
  @ApiProperty({
    description: 'The URL that the webhook will send events to.',
    example: 'https://your-webhook-url.com',
  })
  url: string

  @ApiProperty({
    description: 'Whether to enable batching for the webhook. Defaults to `false`.',
    example: true,
    required: false,
  })
  enableBatching?: boolean

  @ApiProperty({
    description:
      'The event types that the webhook will send. Defaults to `["*"] (all event types)`.',
    example: ['page', 'track', 'identify', 'group'],
    required: false,
  })
  eventTypes?: string[]

  @ApiProperty({
    description:
      'The event names that the webhook will send. Defaults to `["*"] (all event names)`.',
    example: ['UserSignedUp', 'UserLoggedIn'],
    required: false,
  })
  eventNames?: string[]
}

export class PaginatedWebhookResponse extends PaginatedResponse<Webhook> {
  @ApiProperty({ type: [Webhook] })
  results: Webhook[]
}
