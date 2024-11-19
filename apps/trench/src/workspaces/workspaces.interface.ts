import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class Workspace {
  @ApiProperty({
    description: 'The unique identifier of the workspace.',
    example: 'workspace-1234',
  })
  workspaceId: string

  @ApiProperty({
    description: 'The name of the workspace.',
    example: 'Development Workspace',
  })
  name: string

  @ApiProperty({
    description: 'Indicates if this is the default workspace.',
    example: true,
  })
  isDefault: boolean

  @ApiProperty({
    description: 'The name of the database associated with the workspace.',
    example: 'default',
  })
  databaseName: string

  @ApiProperty({
    description: 'The date and time when the workspace was created.',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date

  @ApiPropertyOptional({
    description: 'The properties of the workspace.',
    example: '{}',
  })
  properties: Record<string, any>
}

export class CreateWorkspaceDto {
  @ApiProperty({
    description: 'The name of the workspace to be created.',
    example: 'New Workspace',
  })
  name: string

  @ApiPropertyOptional({
    description: 'The name of the database associated with the workspace.',
    example: 'workspace_db',
  })
  databaseName?: string

  @ApiPropertyOptional({
    description: 'Indicates if the new workspace should be set as default. Defaults to `false`.',
    example: false,
  })
  isDefault?: boolean

  @ApiPropertyOptional({
    description: 'The properties of the workspace.',
    example: '{}',
  })
  properties?: Record<string, any>
}

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({
    description: 'The name of the workspace to be updated.',
    example: 'Updated Workspace',
  })
  name?: string

  @ApiPropertyOptional({
    description: 'The properties of the workspace.',
    example: '{}',
  })
  properties?: Record<string, any>
}

export class WorkspaceCreationResult extends Workspace {
  @ApiProperty({
    description: 'The private API key for the workspace.',
    example: 'private-api-key-1234',
  })
  privateApiKey: string

  @ApiProperty({
    description: 'The public API key for the workspace.',
    example: 'public-api-key-1234',
  })
  publicApiKey: string
}
