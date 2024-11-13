import { authenticatedPost, waitForQueryResults } from './utils'

describe('events/', () => {
  test('should create a new event and fetch it', async () => {
    const newEvent = {
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      type: 'track',
      event: 'User SignedUp',
      timestamp: new Date().toISOString(),
    }

    // Create a new event
    const createRes = await authenticatedPost('/events', false).send({ events: [newEvent] })
    expect(createRes.statusCode).toEqual(201)
    expect(createRes.body.results).toHaveLength(1)
    expect(createRes.body.results[0].uuid).toBeDefined()
    const eventUuid = createRes.body.results[0].uuid

    // Fetch the created event using the newly created util function
    const results = await waitForQueryResults(`uuid=${eventUuid}`)
    expect(results).toHaveLength(1)
    expect(results[0].uuid).toEqual(eventUuid)
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
    const createRes = await authenticatedPost('/events', false).send({ events: [newEvent] })
    expect(createRes.statusCode).toEqual(201)
    expect(createRes.body.results).toHaveLength(1)
    expect(createRes.body.results[0].uuid).toBeDefined()
    const eventUuid = createRes.body.results[0].uuid

    // Fetch the created event using the instanceId, event name, and userId
    const results = await waitForQueryResults(
      `uuid=${eventUuid}&event=User%20Logged%20In&userId=user-123&instanceId=instance-456`
    )
    expect(results).toHaveLength(1)
    expect(results[0].uuid).toEqual(eventUuid)
    expect(results[0].event).toEqual('User Logged In')
    expect(results[0].userId).toEqual('user-123')
    expect(results[0].instanceId).toEqual('instance-456')
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
    const createRes = await authenticatedPost('/events', false).send({ events: [newEvent] })
    expect(createRes.statusCode).toEqual(201)
    expect(createRes.body.results).toHaveLength(1)
    expect(createRes.body.results[0].uuid).toBeDefined()
    const eventUuid = createRes.body.results[0].uuid

    // Fetch the created event using the properties
    const results = await waitForQueryResults(
      `uuid=${eventUuid}&properties.plan=premium&properties.country=USA`
    )
    expect(results).toHaveLength(1)
    expect(results[0].uuid).toEqual(eventUuid)
    expect(results[0].event).toEqual('User Updated Profile')
    expect(results[0].properties.plan).toEqual('premium')
    expect(results[0].properties.country).toEqual('USA')
  })
})
