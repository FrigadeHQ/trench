import { Module } from '@nestjs/common'
import { BootstrapService } from 'src/services/data/bootstrap/bootstrap.service'
import { KafkaModule } from 'src/services/data/kafka/kafka.module'
import { ClickHouseModule } from 'src/services/data/click-house/click-house.module'
import { WorkspacesModule } from 'src/workspaces/workspaces.module'

@Module({
  imports: [ClickHouseModule, KafkaModule],
  providers: [BootstrapService],
  exports: [BootstrapService],
})
export class BootstrapModule {}
