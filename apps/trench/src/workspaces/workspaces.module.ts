import { Module } from '@nestjs/common'
import { WorkspacesService } from './workspaces.service'
import { ClickhouseModule } from '../services/data/clickhouse/clickhouse.module'

@Module({
  imports: [ClickhouseModule],
  controllers: [],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
