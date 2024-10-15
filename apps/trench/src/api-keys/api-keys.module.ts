import { Module } from '@nestjs/common'
import { ApiKeysService } from './api-keys.service'

@Module({
  imports: [],
  controllers: [],
  providers: [ApiKeysService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
