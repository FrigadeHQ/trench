export function isReadOnlyQuery(query: string): boolean {
  // Regular expression to match non-readonly SQL commands
  const nonReadOnlyCommands =
    /\b(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TRUNCATE|REPLACE|MERGE|CALL|GRANT|REVOKE|LOCK|UNLOCK)\b/i

  // Remove string literals from the query to avoid false positives
  const cleanedQuery = query.replace(/'[^']*'/g, '')

  // Test the cleaned query against the regular expression
  return !nonReadOnlyCommands.test(cleanedQuery)
}

export function convertToKebabCase(query: string): string {
  return query
    .replaceAll(/userId/g, 'user_id')
    .replaceAll(/groupId/g, 'group_id')
    .replaceAll(/instanceId/g, 'instance_id')
}

export function convertJsonKeysToCamelCase(json: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}

  for (const key in json) {
    if (json.hasOwnProperty(key)) {
      const camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
      result[camelCaseKey] = json[key]
    }
  }

  return result
}

function parseJsonField(field: any): any {
  if (typeof field === 'string') {
    try {
      return JSON.parse(field)
    } catch (error) {
      console.error('Error parsing JSON field:', error)
    }
  }
  return field
}

export function parseJsonFields(json: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = { ...json }

  result.properties = parseJsonField(result.properties)
  result.context = parseJsonField(result.context)

  return result
}

export function appendWorkspaceId(workspaceId: string, query: string): string {
  query = query.replace(/--[^\n]*/g, '')

  // Process a single query by adding workspace_id
  const processQuery = (q: string): string => {
    const parts = q.split(/\b(FROM)\b/i)

    if (parts.length >= 3) {
      const beforeFrom = parts[0]
      const fromKeyword = parts[1]
      const afterFrom = parts.slice(2).join('')

      // Only add workspace_id if it's not already present
      if (!afterFrom.includes(`workspace_id = '${workspaceId}'`)) {
        const hasWhere = /\bWHERE\b/i.test(afterFrom)
        const otherClauses = /\b(GROUP BY|HAVING|ORDER BY|LIMIT|OFFSET)\b/i.exec(afterFrom)

        let newAfterFrom = afterFrom
        if (hasWhere) {
          newAfterFrom = afterFrom.replace(
            /\bWHERE\b/i,
            `WHERE workspace_id = '${workspaceId}' AND`
          )
        } else if (otherClauses) {
          const position = otherClauses.index
          newAfterFrom =
            afterFrom.slice(0, position) +
            ` WHERE workspace_id = '${workspaceId}' ` +
            afterFrom.slice(position)
        } else {
          newAfterFrom = afterFrom + ` WHERE workspace_id = '${workspaceId}'`
        }

        return `${beforeFrom}${fromKeyword}${newAfterFrom}`
      }
    }
    return q
  }

  // Find and process subqueries first
  const subqueryRegex = /\((SELECT[^()]*)\)/gi
  let result = query
  result = result.replace(subqueryRegex, (match, subquery) => {
    return `(${processQuery(subquery)})`
  })

  // Then process the main query
  result = processQuery(result)
  return result.replace(/\s+/g, ' ').trim()
}
