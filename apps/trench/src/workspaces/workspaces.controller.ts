import {
  Controller,
  Post,
  Body,
  UseGuards,
  Delete,
  Param,
  Put,
  NotFoundException,
  Get,
} from '@nestjs/common'

import { AdminApiGuard } from 'src/middlewares/admin-api.guard'
import { WorkspacesService } from 'src/workspaces/workspaces.service'
import { CreateWorkspaceDto, Workspace } from 'src/workspaces/workspaces.interface'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

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

  @Delete(':workspaceId')
  async delete(@Param('workspaceId') workspaceId: string) {
    await this.workspacesService.deleteWorkspace(workspaceId)
  }

  @Put(':workspaceId')
  @ApiOperation({ summary: 'Update a workspace' })
  @ApiResponse({
    status: 200,
    description:
      'The workspace has been successfully updated. Requires private API key in Bearer token.',
    type: Workspace,
  })
  async update(
    @Param('workspaceId') workspaceId: string,
    @Body() updateWorkspaceDto: CreateWorkspaceDto
  ) {
    // Assuming the method name should be 'updateWorkspace' based on the error
    const updatedWorkspace = await this.workspacesService.updateWorkspace(
      workspaceId,
      updateWorkspaceDto
    )

    return updatedWorkspace
  }

  @Get(':workspaceId')
  @ApiOperation({ summary: 'Get a workspace by ID' })
  @ApiResponse({
    status: 200,
    description: 'The workspace has been successfully retrieved.',
    type: Workspace,
  })
  async getById(@Param('workspaceId') workspaceId: string) {
    const workspace = await this.workspacesService.getWorkspaceById(workspaceId)

    if (!workspace) {
      throw new NotFoundException('Workspace not found')
    }

    return workspace
  }
}
