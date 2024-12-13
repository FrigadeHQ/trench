import { Module } from '@nestjs/common'
import { ApiKeysService } from 'src/api-keys/api-keys.service'
import { ClickHouseModule } from 'src/services/data/click-house/click-house.module'
import { CacheModule } from '@nestjs/cache-manager'

@Module({
  imports: [
    ClickHouseModule,
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
