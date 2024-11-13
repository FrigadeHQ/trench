import { Module } from '@nestjs/common'
import { BootstrapService } from './bootstrap.service'
import { KafkaModule } from '../kafka/kafka.module'
import { ClickhouseModule } from '../clickhouse/clickhouse.module'
import { WorkspacesModule } from '../../../workspaces/workspaces.module'

@Module({
  imports: [ClickhouseModule, KafkaModule],
  providers: [BootstrapService],
  exports: [BootstrapService],
})
export class BootstrapModule {}
