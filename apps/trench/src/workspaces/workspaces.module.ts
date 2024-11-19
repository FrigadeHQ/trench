import { Module } from '@nestjs/common'
import { WorkspacesService } from './workspaces.service'
import { ClickHouseModule } from '../services/data/click-house/click-house.module'
import { WorkspacesController } from './workspaces.controller'
import { ApiKeysModule } from '../api-keys/api-keys.module'
import { BootstrapModule } from '../services/data/bootstrap/bootstrap.module'

@Module({
  imports: [ClickHouseModule, ApiKeysModule, BootstrapModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
