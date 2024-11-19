import { Injectable } from '@nestjs/common'
import { ApiKeysService } from '../api-keys/api-keys.service'
import { ApiGuard } from './api.guard'

@Injectable()
export class AdminApiGuard extends ApiGuard {
  constructor(apiKeysService: ApiKeysService) {
    super(apiKeysService, 'admin')
  }
}
