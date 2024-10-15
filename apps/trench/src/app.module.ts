import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { EventsModule } from './events/events.module'
import { ConfigModule } from '@nestjs/config'
import { ClickhouseModule } from './services/data/clickhouse/clickhouse.module'
import { ApiKeysModule } from './api-keys/api-keys.module'
import { ApiKeysService } from './api-keys/api-keys.service'
import { QueriesModule } from './queries/queries.module'
import { WebhooksModule } from './webhooks/webhooks.module'
import { CacheModule } from '@nestjs/cache-manager'

@Module({
  imports: [
    ConfigModule.forRoot(),
    CacheModule.register({
      ttl: 1000 * 60 * 10, // 10 minutes (in milliseconds)
      max: 100000, // maximum number of items in cache
    }),
    EventsModule,
    ClickhouseModule,
    QueriesModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
