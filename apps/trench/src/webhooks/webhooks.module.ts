import { Module } from '@nestjs/common'
import { WebhooksService } from './webhooks.service'
import { ClickHouseModule } from '../services/data/click-house/click-house.module'
import { KafkaModule } from '../services/data/kafka/kafka.module'
import { EventsModule } from '../events/events.module'
import { WebhooksDao } from './webhooks.dao'
import { WebhooksController } from './webhooks.controller'
import { ApiKeysService } from '../api-keys/api-keys.service'
import { ApiKeysModule } from '../api-keys/api-keys.module'
import { CacheModule } from '@nestjs/cache-manager'

@Module({
  imports: [
    KafkaModule,
    ClickHouseModule,
    EventsModule,
    WebhooksModule,
    ApiKeysModule,
    CacheModule.register({
      ttl: 1000 * 60 * 10, // 10 minutes (in milliseconds)
      max: 100000, // maximum number of items in cache
    }),
  ],
  providers: [WebhooksService, WebhooksDao],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
