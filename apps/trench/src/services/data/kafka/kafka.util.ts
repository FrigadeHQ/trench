import { Workspace } from 'src/workspaces/workspaces.interface'

export function getKafkaTopicFromWorkspace(workspace: Workspace): string {
  if (workspace.isDefault) {
    return process.env.KAFKA_TOPIC
  }
  return `${workspace.databaseName}_${process.env.KAFKA_TOPIC}`
}
