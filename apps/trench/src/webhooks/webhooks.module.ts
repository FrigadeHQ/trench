import { Module } from '@nestjs/common'
import { WebhooksService } from 'src/webhooks/webhooks.service'
import { ClickHouseModule } from 'src/services/data/click-house/click-house.module'
import { KafkaModule } from 'src/services/data/kafka/kafka.module'
import { EventsModule } from 'src/events/events.module'
import { WebhooksDao } from 'src/webhooks/webhooks.dao'
import { WebhooksController } from 'src/webhooks/webhooks.controller'
import { ApiKeysService } from 'src/api-keys/api-keys.service'
import { ApiKeysModule } from 'src/api-keys/api-keys.module'
import { CacheModule } from '@nestjs/cache-manager'
import { WorkspacesModule } from 'src/workspaces/workspaces.module'

@Module({
  imports: [
    KafkaModule,
    ClickHouseModule,
    EventsModule,
    WebhooksModule,
    ApiKeysModule,
    WorkspacesModule,
    CacheModule.register({
      ttl: 1000 * 60 * 10, // 10 minutes (in milliseconds)
      max: 100000, // maximum number of items in cache
    }),
  ],
  providers: [WebhooksService, WebhooksDao],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
