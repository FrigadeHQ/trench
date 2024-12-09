export function escapeString(str: string) {
  return str
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/'/g, "\\'") // Escape single quotes
    .replace(/"/g, '\\"') // Escape double quotes
}

/**
 * Formats a date to be used in a ClickHouse query.
 *
 * The date will be formatted as ISO 8601, without the timezone "Z" at the end.
 * The date will also be escaped to be safe to use in a ClickHouse query.
 */
export function formatToClickhouseDate(date: Date): string {
  const isoString = date.toISOString()
  const clickhouseDate = isoString.replace('Z', '')
  return escapeString(clickhouseDate)
}
