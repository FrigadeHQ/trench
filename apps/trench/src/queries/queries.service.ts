import { Injectable } from '@nestjs/common'
import { ClickHouseService } from '../services/data/click-house/click-house.service'
import {
  convertJsonKeysToCamelCase,
  convertObjectToArray,
  convertToKebabCase,
  isReadOnlyQuery,
  parseJsonFields,
} from './queries.util'
import { QueriesDTO } from './queries.interface'
import { WorkspacesService } from '../workspaces/workspaces.service'
import { Workspace } from '../workspaces/workspaces.interface'

@Injectable()
export class QueriesService {
  constructor(private readonly clickhouseService: ClickHouseService) {}

  async sendQueries(workspace: Workspace, queries: QueriesDTO): Promise<any[]> {
    if (!queries.queries) {
      throw new Error('Request must contain a `queries` array')
    }
    // Validate that all queries are read-only
    for (const query of queries.queries) {
      if (!isReadOnlyQuery(query)) {
        throw new Error(
          `Query ${query} is not read-only. This endpoint is only for read-only queries to avoid accidentally corrupting data.`
        )
      }
    }

    const queryPromises = queries.queries.map((query) =>
      this.clickhouseService.queryResults(convertToKebabCase(query), workspace.databaseName)
    )
    const results = await Promise.all(queryPromises)
    return results.map((result) =>
      convertObjectToArray(parseJsonFields(convertJsonKeysToCamelCase(result)))
    )
  }
}
