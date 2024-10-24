import { Module } from '@nestjs/common'
import { QueriesService } from './queries.service'
import { QueriesController } from './queries.controller'
import { ClickhouseService } from '../services/data/clickhouse/clickhouse.service'
import { ClickhouseModule } from '../services/data/clickhouse/clickhouse.module'
import { ApiKeysModule } from '../api-keys/api-keys.module'

@Module({
  imports: [ClickhouseModule, ApiKeysModule],
  controllers: [QueriesController],
  providers: [QueriesService, ClickhouseService],
})
export class QueriesModule {}
