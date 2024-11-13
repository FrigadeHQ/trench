import { Injectable } from '@nestjs/common'
import { ClickhouseService } from '../services/data/clickhouse/clickhouse.service'
import {
  convertJsonKeysToCamelCase,
  convertToKebabCase,
  isReadOnlyQuery,
  parseJsonFields,
} from './queries.util'
import { QueriesDTO } from './queries.interface'
import { WorkspacesService } from '../workspaces/workspaces.service'

@Injectable()
export class QueriesService {
  constructor(
    private readonly clickhouseService: ClickhouseService,
    private readonly workspacesService: WorkspacesService
  ) {}

  async sendQueries(workspaceId: string, queries: QueriesDTO): Promise<any[]> {
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
      this.clickhouseService.query(convertToKebabCase(query))
    )
    const results = await Promise.all(queryPromises)
    return results.map((result) => parseJsonFields(convertJsonKeysToCamelCase(result)))
  }
}
