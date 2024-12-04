export function flatten(data: any): Record<string, any> {
  const result: Record<string, any> = {}

  function recurse(cur: any, prop: string) {
    if (Object(cur) !== cur) {
      result[prop] = cur
    } else if (cur instanceof Date) {
      result[prop] = cur.toISOString()
    } else if (Array.isArray(cur)) {
      for (let i = 0; i < cur.length; i++) {
        recurse(cur[i], prop + '_' + i)
      }
      if (cur.length === 0) {
        result[prop] = []
      }
    } else {
      let isEmpty = true
      for (const p in cur) {
        isEmpty = false
        recurse(cur[p], prop ? prop + '_' + p : p)
      }
      if (isEmpty && prop) {
        result[prop] = {}
      }
    }
  }

  recurse(data, '')
  return result
}
