import { Module } from '@nestjs/common'
import { QueriesService } from 'src/queries/queries.service'
import { QueriesController } from 'src/queries/queries.controller'
import { ClickHouseService } from 'src/services/data/click-house/click-house.service'
import { ClickHouseModule } from 'src/services/data/click-house/click-house.module'
import { ApiKeysModule } from 'src/api-keys/api-keys.module'
import { WorkspacesModule } from 'src/workspaces/workspaces.module'

@Module({
  imports: [ClickHouseModule, ApiKeysModule, WorkspacesModule],
  controllers: [QueriesController],
  providers: [QueriesService, ClickHouseService],
})
export class QueriesModule {}
