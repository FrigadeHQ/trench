import {
  Controller,
  Post,
  Body,
  UseGuards,
  Delete,
  Put,
  Get,
  Request,
} from '@nestjs/common'

import { AdminApiGuard } from 'src/middlewares/admin-api.guard'
import { WorkspacesService } from 'src/workspaces/workspaces.service'
import { CreateWorkspaceDto, Workspace } from 'src/workspaces/workspaces.interface'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'
import { getWorkspace } from 'src/common/request'

@Controller('workspaces')
@UseGuards(AdminApiGuard)
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

  @Delete()
  async delete(@Request() request: Request) {
    const workspace = getWorkspace(request)
    await this.workspacesService.deleteWorkspace(workspace.workspaceId)
  }

  @Put()
  @ApiOperation({ summary: 'Update a workspace' })
  @ApiResponse({
    status: 200,
    description:
      'The workspace has been successfully updated. Requires private API key in Bearer token.',
    type: Workspace,
  })
  async update(@Request() request: Request, @Body() updateWorkspaceDto: CreateWorkspaceDto) {
    const workspace = getWorkspace(request)
    const updatedWorkspace = await this.workspacesService.updateWorkspace(
      workspace.workspaceId,
      updateWorkspaceDto
    )

    return updatedWorkspace
  }

  @Get()
  @ApiOperation({ summary: 'Get the authenticated workspace' })
  @ApiResponse({
    status: 200,
    description: 'The workspace has been successfully retrieved.',
    type: Workspace,
  })
  async getById(@Request() request: Request) {
    const workspace = getWorkspace(request)

    return workspace
  }
}
