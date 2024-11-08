import {
  isReadOnlyQuery,
  convertToKebabCase,
  convertJsonKeysToCamelCase,
  parseJsonFields,
  appendWorkspaceId,
} from '../../src/queries/queries.util'

describe('queries.util', () => {
  describe('isReadOnlyQuery', () => {
    test('should identify read-only queries', () => {
      expect(isReadOnlyQuery('SELECT * FROM users')).toBe(true)
      expect(isReadOnlyQuery('SELECT id, name FROM events WHERE id = 1')).toBe(true)
    })

    test('should identify non-read-only queries', () => {
      expect(isReadOnlyQuery('INSERT INTO users VALUES (1)')).toBe(false)
      expect(isReadOnlyQuery('UPDATE users SET name = "test"')).toBe(false)
      expect(isReadOnlyQuery('DELETE FROM users')).toBe(false)
    })

    test('should handle queries with string literals correctly', () => {
      expect(isReadOnlyQuery("SELECT * FROM users WHERE name = 'DELETE'")).toBe(true)
      expect(isReadOnlyQuery("SELECT * FROM users WHERE name = 'INSERT'")).toBe(true)
    })
  })

  describe('convertToKebabCase', () => {
    test('should convert camelCase IDs to snake_case', () => {
      const input = 'SELECT userId, groupId, instanceId FROM users'
      const expected = 'SELECT user_id, group_id, instance_id FROM users'
      expect(convertToKebabCase(input)).toBe(expected)
    })

    test('should not modify other parts of the query', () => {
      const input = 'SELECT name, userId FROM users WHERE age > 18'
      const expected = 'SELECT name, user_id FROM users WHERE age > 18'
      expect(convertToKebabCase(input)).toBe(expected)
    })
  })

  describe('convertJsonKeysToCamelCase', () => {
    test('should convert snake_case keys to camelCase', () => {
      const input = {
        user_id: 1,
        first_name: 'John',
        last_name: 'Doe',
      }
      const expected = {
        userId: 1,
        firstName: 'John',
        lastName: 'Doe',
      }
      expect(convertJsonKeysToCamelCase(input)).toEqual(expected)
    })

    test('should handle nested properties correctly', () => {
      const input = {
        user_id: 1,
        user_data: {
          first_name: 'John',
        },
      }
      const expected = {
        userId: 1,
        userData: {
          first_name: 'John',
        },
      }
      expect(convertJsonKeysToCamelCase(input)).toEqual(expected)
    })
  })

  describe('appendWorkspaceId', () => {
    test('should append workspace_id to query without WHERE clause', () => {
      const query = 'SELECT * FROM events'
      const expected = "SELECT * FROM events WHERE workspace_id = 'ws123'"
      expect(appendWorkspaceId('ws123', query)).toBe(expected)
    })

    test('should append workspace_id to query with existing WHERE clause', () => {
      const query = 'SELECT * FROM events WHERE age > 18'
      const expected = "SELECT * FROM events WHERE workspace_id = 'ws123' AND age > 18"
      expect(appendWorkspaceId('ws123', query)).toBe(expected)
    })

    test('should handle query with ORDER BY clause', () => {
      const query = 'SELECT * FROM events ORDER BY name'
      const expected = "SELECT * FROM events WHERE workspace_id = 'ws123' ORDER BY name"
      expect(appendWorkspaceId('ws123', query)).toBe(expected)
    })

    test('should handle query with GROUP BY clause', () => {
      const query = 'SELECT count(*) FROM events GROUP BY instance_id'
      const expected =
        "SELECT count(*) FROM events WHERE workspace_id = 'ws123' GROUP BY instance_id"
      expect(appendWorkspaceId('ws123', query)).toBe(expected)
    })

    test('should handle nested queries', () => {
      const query = 'SELECT * FROM (SELECT * FROM events) AS e'
      const expected = "SELECT * FROM (SELECT * FROM events WHERE workspace_id = 'ws123') AS e"
      expect(appendWorkspaceId('ws123', query)).toBe(expected)
    })

    test('should handle multiple nested queries', () => {
      const query = 'SELECT * FROM (SELECT * FROM events) AS e1, (SELECT * FROM events) AS e2'
      const expected =
        "SELECT * FROM (SELECT * FROM events WHERE workspace_id = 'ws123') AS e1, (SELECT * FROM events WHERE workspace_id = 'ws123') AS e2"
      expect(appendWorkspaceId('ws123', query)).toBe(expected)
    })

    test('should handle queries with single-line comments', () => {
      const query = `
        -- This is a comment
        SELECT * FROM events
        -- Another comment
        ORDER BY timestamp`
      const expected = `SELECT * FROM events WHERE workspace_id = 'ws123' ORDER BY timestamp`
      expect(appendWorkspaceId('ws123', query)).toBe(expected)
    })
  })
})
