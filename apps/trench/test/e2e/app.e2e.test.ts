import { authenticatedGet } from './utils'

describe('/', () => {
  test('should return a 200 on /', async () => {
    const res = await authenticatedGet('/')
    expect(res.statusCode).toEqual(200)
  })
})
