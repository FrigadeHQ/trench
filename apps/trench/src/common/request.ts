import { Request } from '@nestjs/common'

export function getWorkspaceId(req: Request): string {
  const workspaceId = (req as any).workspaceId
  if (!workspaceId) {
    throw new Error('WorkspaceId not found in request. Ensure request is authenticated.')
  }
  return workspaceId
}
