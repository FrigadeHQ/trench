import { Module } from '@nestjs/common'
import { BootstrapService } from './bootstrap.service'
import { KafkaModule } from '../kafka/kafka.module'
import { ClickHouseModule } from '../click-house/click-house.module'
import { WorkspacesModule } from '../../../workspaces/workspaces.module'

@Module({
  imports: [ClickHouseModule, KafkaModule],
  providers: [BootstrapService],
  exports: [BootstrapService],
})
export class BootstrapModule {}
