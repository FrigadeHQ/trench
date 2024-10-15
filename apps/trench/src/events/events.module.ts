import { Module } from '@nestjs/common'
import { EventsService } from './events.service'
import { EventsController } from './events.controller'
import { KafkaModule } from '../services/data/kafka/kafka.module'
import { ApiKeysModule } from '../api-keys/api-keys.module'
import { EventsDao } from './events.dao'
import { ClickhouseModule } from '../services/data/clickhouse/clickhouse.module'

@Module({
  imports: [KafkaModule, ApiKeysModule, ClickhouseModule],
  controllers: [EventsController],
  providers: [EventsService, EventsDao],
  exports: [EventsService],
})
export class EventsModule {}
