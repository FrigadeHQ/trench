import { Controller, Post, Body, UseGuards } from '@nestjs/common'

import { PrivateApiGuard } from '../middlewares/private-api.guard'
import { WorkspacesService } from './workspaces.service'
import { CreateWorkspaceDto, Workspace } from './workspaces.interface'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

@Controller('workspaces')
@UseGuards(PrivateApiGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}
  @Post()
  @ApiOperation({ summary: 'Create a workspace' })
  @ApiResponse({
    status: 200,
    description:
      'The workspace has been successfully created. Requires private API key in Bearer token.',
    type: Workspace,
  })
  async create(@Body() createWorkspaceDto: CreateWorkspaceDto) {
    const newWorkspace = await this.workspacesService.createNewWorkspace(createWorkspaceDto)

    return newWorkspace
  }
}
