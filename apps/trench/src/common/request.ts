import { Request } from '@nestjs/common'
import { Workspace } from 'src/workspaces/workspaces.interface'

export function getWorkspace(req: Request): Workspace {
  const workspace = (req as any).workspace
  if (!workspace) {
    throw new Error('Workspace not found in request. Ensure request is authenticated.')
  }
  return workspace
}
