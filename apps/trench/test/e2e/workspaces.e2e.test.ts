import { authenticatedGet, authenticatedPost, getRandomID, waitForQueryResults } from './utils'

describe('workspaces/', () => {
  test('should create a new workspace', async () => {
    const res = await authenticatedPost('/workspaces').send({ name: getRandomID() })
    expect(res.statusCode).toEqual(201)
    expect(res.body.workspaceId).toBeDefined()
  })

  test('should create a new workspace, create events, and query them', async () => {
    // Create a new workspace and get API keys
    const workspaceRes = await authenticatedPost('/workspaces').send({ name: getRandomID() })
    expect(workspaceRes.statusCode).toEqual(201)
    expect(workspaceRes.body.workspaceId).toBeDefined()
    expect(workspaceRes.body.publicApiKey).toBeDefined()
    expect(workspaceRes.body.privateApiKey).toBeDefined()
    const workspaceId = workspaceRes.body.workspaceId
    const publicApiKey = workspaceRes.body.publicApiKey
    const privateApiKey = workspaceRes.body.privateApiKey

    // Create a new event using the private API key
    const newEvent = {
      type: 'track',
      event: 'User Created Workspace',
    }
    const createEventRes = await authenticatedPost('/events')
      .set('Authorization', 'Bearer ' + publicApiKey)
      .send({ events: [newEvent] })
    expect(createEventRes.statusCode).toEqual(201)
    expect(createEventRes.body.results).toHaveLength(1)
    expect(createEventRes.body.results[0].uuid).toBeDefined()
    const eventUuid = createEventRes.body.results[0].uuid

    // Query the created event using the public API key
    const queryResults = await waitForQueryResults(`uuid=${eventUuid}`, privateApiKey)
    expect(queryResults).toHaveLength(1)
    expect(queryResults[0].uuid).toEqual(eventUuid)
  })
})
