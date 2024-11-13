import {
  isReadOnlyQuery,
  convertToKebabCase,
  convertJsonKeysToCamelCase,
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
})
