import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Observable } from 'rxjs'
import { ApiKeysService } from '../api-keys/api-keys.service'
import { ApiKeyType } from '../api-keys/api-keys.interface'

export class ApiGuard implements CanActivate {
  constructor(
    protected readonly apiKeysService: ApiKeysService,
    protected readonly apiKeyType: ApiKeyType
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return this.validateRequest(context)
  }

  async validateRequest(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    if (!req.headers.authorization) {
      throw new UnauthorizedException(
        `Missing Authorization header. Add "Authorization: Bearer <api-key>" with your ${this.apiKeyType} API key to your request.`
      )
    }

    const apiKey = req.headers.authorization.replace('Bearer ', '')
    const workspace = await this.apiKeysService.getWorkspaceFromApiKey(apiKey, this.apiKeyType)

    if (!workspace) {
      throw new UnauthorizedException(`Invalid ${this.apiKeyType} API key`)
    }

    // Add workspace object to request context
    req.workspace = workspace

    return true
  }
}
