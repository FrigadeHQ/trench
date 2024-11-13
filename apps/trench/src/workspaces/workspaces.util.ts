import { Workspace } from './workspaces.interface'

export function mapRowToWorkspace(result: any): Workspace {
  return {
    workspaceId: result.workspace_id,
    name: result.name,
    isDefault: result.is_default,
    databaseName: result.database_name,
    createdAt: result.created_at,
  }
}
