import { Injectable } from '@nestjs/common'

@Injectable()
export class ApiKeysService {
  constructor() {}

  async validateApiKey(apiKey: string, type: 'public' | 'private'): Promise<boolean> {
    const apiKeys = process.env[type === 'public' ? 'PUBLIC_API_KEYS' : 'PRIVATE_API_KEYS']
    return apiKeys.split(',').includes(apiKey)
  }
}
