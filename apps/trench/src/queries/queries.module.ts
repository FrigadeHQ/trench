import { Module } from '@nestjs/common'
import { QueriesService } from './queries.service'
import { QueriesController } from './queries.controller'
import { ClickHouseService } from '../services/data/click-house/click-house.service'
import { ClickHouseModule } from '../services/data/click-house/click-house.module'
import { ApiKeysModule } from '../api-keys/api-keys.module'
import { WorkspacesModule } from '../workspaces/workspaces.module'

@Module({
  imports: [ClickHouseModule, ApiKeysModule, WorkspacesModule],
  controllers: [QueriesController],
  providers: [QueriesService, ClickHouseService],
})
export class QueriesModule {}
