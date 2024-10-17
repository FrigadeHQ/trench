import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Observable } from 'rxjs'
import { ApiKeysService } from '../api-keys/api-keys.service'

@Injectable()
export class PublicApiGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return this.validateRequest(context)
  }

  async validateRequest(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    if (!req.headers.authorization) {
      throw new UnauthorizedException(
        'Missing Authorization header. Add `Authorization: Bearer <api-key>` with your public API key to your request.'
      )
    }

    const apiKey = req.headers.authorization.replace('Bearer ', '')
    let isValid = await this.apiKeysService.validateApiKey(apiKey, 'public')

    if (!isValid) {
      isValid = await this.apiKeysService.validateApiKey(apiKey, 'private')
    }

    if (!isValid) {
      throw new UnauthorizedException('Invalid public API key')
    }

    return true
  }
}
