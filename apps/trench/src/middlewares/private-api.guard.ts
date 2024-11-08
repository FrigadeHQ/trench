import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Observable } from 'rxjs'
import { ApiKeysService } from '../api-keys/api-keys.service'

@Injectable()
export class PrivateApiGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return this.validateRequest(context)
  }

  async validateRequest(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    if (!req.headers.authorization) {
      throw new UnauthorizedException(
        'Missing Authorization header. Add `Authorization: Bearer <api-key>` with your private API key to your request.'
      )
    }

    const apiKey = req.headers.authorization.replace('Bearer ', '')
    const workspaceId = await this.apiKeysService.getWorkspaceIdFromApiKey(apiKey, 'private')

    if (!workspaceId) {
      throw new UnauthorizedException('Invalid private API key')
    }

    // Add workspace ID to request context
    req.workspaceId = workspaceId

    return true
  }
}
