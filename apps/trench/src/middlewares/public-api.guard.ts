import { Injectable } from '@nestjs/common'
import { ApiKeysService } from 'src/api-keys/api-keys.service'
import { ApiGuard } from 'src/middlewares/api.guard'

@Injectable()
export class PublicApiGuard extends ApiGuard {
  constructor(apiKeysService: ApiKeysService) {
    super(apiKeysService, 'public')
  }
}
