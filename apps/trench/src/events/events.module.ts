import { Module } from '@nestjs/common'
import { EventsService } from 'src/events/events.service'
import { EventsController } from 'src/events/events.controller'
import { KafkaModule } from 'src/services/data/kafka/kafka.module'
import { ApiKeysModule } from 'src/api-keys/api-keys.module'
import { EventsDao } from 'src/events/events.dao'
import { ClickHouseModule } from 'src/services/data/click-house/click-house.module'

@Module({
  imports: [KafkaModule, ApiKeysModule, ClickHouseModule],
  controllers: [EventsController],
  providers: [EventsService, EventsDao],
  exports: [EventsService],
})
export class EventsModule {}
