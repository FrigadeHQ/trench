import { Module } from '@nestjs/common'
import { WorkspacesService } from 'src/workspaces/workspaces.service'
import { ClickHouseModule } from 'src/services/data/click-house/click-house.module'
import { WorkspacesController } from 'src/workspaces/workspaces.controller'
import { ApiKeysModule } from 'src/api-keys/api-keys.module'
import { BootstrapModule } from 'src/services/data/bootstrap/bootstrap.module'

@Module({
  imports: [ClickHouseModule, ApiKeysModule, BootstrapModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
