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
  return query.replace(/userId/g, 'user_id').replace(/groupId/g, 'group_id')
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
