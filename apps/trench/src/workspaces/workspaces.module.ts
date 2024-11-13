import { Module } from '@nestjs/common'
import { WorkspacesService } from './workspaces.service'
import { ClickhouseModule } from '../services/data/clickhouse/clickhouse.module'
import { WorkspacesController } from './workspaces.controller'
import { ApiKeysModule } from '../api-keys/api-keys.module'
import { BootstrapModule } from '../services/data/bootstrap/bootstrap.module'

@Module({
  imports: [ClickhouseModule, ApiKeysModule, BootstrapModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
