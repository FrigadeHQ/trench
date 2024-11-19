import { Module } from '@nestjs/common'
import { ClickHouseService } from './click-house.service'

@Module({
  providers: [ClickHouseService],
  exports: [ClickHouseService],
})
export class ClickHouseModule {}
