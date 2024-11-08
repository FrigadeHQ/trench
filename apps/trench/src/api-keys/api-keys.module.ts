import { Module } from '@nestjs/common'
import { ApiKeysService } from './api-keys.service'
import { ClickhouseModule } from '../services/data/clickhouse/clickhouse.module'

@Module({
  imports: [ClickhouseModule],
  controllers: [],
  providers: [ApiKeysService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
