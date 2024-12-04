import { authenticatedPost, PUBLIC_API_KEY, waitForQueryResults } from './utils'

describe('events/', () => {
  test('should create a new event and fetch it', async () => {
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
    expect(createRes.body.results[0].uuid).toBeDefined()
    const uuid = createRes.body.results[0].uuid

    // Fetch the created event using the newly created util function
    const queryResults = await waitForQueryResults(`uuid=${uuid}`)
    expect(queryResults.results).toHaveLength(1)
    expect(queryResults.results[0].uuid).toEqual(uuid)
  })

  test('should create a new event with instanceId, event name with spaces, and userId, then fetch it', async () => {
    const newEvent = {
      uuid: '123e4567-e89b-12d3-a456-426614174001',
      type: 'track',
      event: 'User Logged In',
      userId: 'user-123',
      instanceId: 'instance-456',
      timestamp: new Date().toISOString(),
    }

    // Create a new event
    const createRes = await authenticatedPost('/events', PUBLIC_API_KEY).send({
      events: [newEvent],
    })
    expect(createRes.statusCode).toEqual(201)
    expect(createRes.body.results).toHaveLength(1)
    expect(createRes.body.total).toEqual(1)
    expect(createRes.body.results[0].uuid).toBeDefined()
    const eventUuid = createRes.body.results[0].uuid

    // Fetch the created event using the instanceId, event name, and userId
    const results = await waitForQueryResults(
      `uuid=${eventUuid}&event=User%20Logged%20In&userId=user-123&instanceId=instance-456`
    )
    expect(results.total).toEqual(1)
    expect(results.results[0].uuid).toEqual(eventUuid)
    expect(results.results[0].event).toEqual('User Logged In')
    expect(results.results[0].userId).toEqual('user-123')
    expect(results.results[0].instanceId).toEqual('instance-456')
  })

  test('should create a new event with properties and fetch it using properties', async () => {
    const newEvent = {
      uuid: '123e4567-e89b-12d3-a456-426614174002',
      type: 'track',
      event: 'User Updated Profile',
      properties: {
        plan: 'premium',
        country: 'USA',
      },
      timestamp: new Date().toISOString(),
    }

    // Create a new event
    const createRes = await authenticatedPost('/events', PUBLIC_API_KEY).send({
      events: [newEvent],
    })
    expect(createRes.statusCode).toEqual(201)
    expect(createRes.body.results).toHaveLength(1)
    expect(createRes.body.total).toEqual(1)
    expect(createRes.body.results[0].uuid).toBeDefined()
    const eventUuid = createRes.body.results[0].uuid

    // Fetch the created event using the properties
    const queryResults = await waitForQueryResults(
      `uuid=${eventUuid}&properties.plan=premium&properties.country=USA`
    )
    expect(queryResults.total).toEqual(1)
    expect(queryResults.results[0].uuid).toEqual(eventUuid)
    expect(queryResults.results[0].event).toEqual('User Updated Profile')
    expect(queryResults.results[0].properties.plan).toEqual('premium')
    expect(queryResults.results[0].properties.country).toEqual('USA')
  })
})
