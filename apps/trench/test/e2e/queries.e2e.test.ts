import { authenticatedPost, PUBLIC_API_KEY, waitForQueryResults } from './utils'

describe('queries/', () => {
  test('should create an event and execute a simple read-only query on it', async () => {
    const newEvent = {
      type: 'track',
      event: 'User SignedUp',
      timestamp: new Date().toISOString(),
    }

    // Create a new event
    const createRes = await authenticatedPost('/events', PUBLIC_API_KEY).send({
      events: [newEvent],
    })
    expect(createRes.statusCode).toEqual(201)
    expect(createRes.body.results).toHaveLength(1)
    expect(createRes.body.total).toEqual(1)
    const eventUuid = createRes.body.results[0].uuid
    // Wait for the event to be created
    const queryResults = await waitForQueryResults(`uuid=${eventUuid}`)
    expect(queryResults.results).toHaveLength(1)
    expect(queryResults.results[0].uuid).toEqual(eventUuid)

    // Execute the query
    const query = `SELECT * FROM events WHERE uuid = '${eventUuid}'`
    const executeRes = await authenticatedPost('/queries').send({
      queries: [query],
    })
    expect(executeRes.statusCode).toEqual(201)
    expect(executeRes.body.results).toHaveLength(1)
    expect(executeRes.body.results[0][0].uuid).toEqual(eventUuid)
  })
})
