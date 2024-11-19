import { Workspace } from './workspaces.interface'

export function mapRowToWorkspace(result: any): Workspace {
  return {
    workspaceId: result.workspace_id,
    name: result.name,
    isDefault: result.is_default,
    databaseName: result.database_name,
    createdAt: result.created_at,
    properties: result.properties ? JSON.parse(result.properties) : undefined,
  }
}

export function mapWorkspaceToRow(workspace: Workspace): any {
  return {
    workspace_id: workspace.workspaceId,
    name: workspace.name,
    is_default: workspace.isDefault,
    database_name: workspace.databaseName,
    created_at: workspace.createdAt,
    properties: JSON.stringify(workspace.properties),
  }
}
