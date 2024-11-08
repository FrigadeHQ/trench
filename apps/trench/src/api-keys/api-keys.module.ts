import { Module } from '@nestjs/common'
import { ApiKeysService } from './api-keys.service'
import { ClickhouseModule } from '../services/data/clickhouse/clickhouse.module'
import { CacheModule } from '@nestjs/cache-manager'

@Module({
  imports: [
    ClickhouseModule,
    CacheModule.register({
      ttl: 1000 * 60 * 2, // 2 minutes
      max: 100000,
    }),
  ],
  controllers: [],
  providers: [ApiKeysService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
