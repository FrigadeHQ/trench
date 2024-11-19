import {
  authenticatedDelete,
  authenticatedGet,
  authenticatedPost,
  authenticatedPut,
  getRandomID,
  waitForQueryResults,
} from './utils'

describe('workspaces/', () => {
  test('should create a new workspace', async () => {
    const res = await authenticatedPost('/workspaces').send({ name: getRandomID() })
    expect(res.statusCode).toEqual(201)
    expect(res.body.workspaceId).toBeDefined()
  })

  test('should create a new workspace, create events, and query them', async () => {
    // Create a new workspace and get API keys
    const workspaceRes = await authenticatedPost('/workspaces').send({
      name: getRandomID(),
      properties: { test: 'test' },
    })
    expect(workspaceRes.body.properties).toEqual({ test: 'test' })
    expect(workspaceRes.statusCode).toEqual(201)
    expect(workspaceRes.body.workspaceId).toBeDefined()
    expect(workspaceRes.body.publicApiKey).toBeDefined()
    expect(workspaceRes.body.privateApiKey).toBeDefined()
    const newPublicApiKey = workspaceRes.body.publicApiKey
    const newPrivateApiKey = workspaceRes.body.privateApiKey

    // Create a new event using the private API key
    const newEvent = {
      type: 'track',
      event: 'User Created Workspace',
    }
    const createEventRes = await authenticatedPost('/events', newPublicApiKey).send({
      events: [newEvent],
    })
    expect(createEventRes.statusCode).toEqual(201)
    expect(createEventRes.body.results).toHaveLength(1)
    expect(createEventRes.body.results[0].uuid).toBeDefined()
    const eventUuid = createEventRes.body.results[0].uuid

    // Query the created event using the public API key
    const queryResults = await waitForQueryResults(`uuid=${eventUuid}`, newPrivateApiKey)
    expect(queryResults).toHaveLength(1)
    expect(queryResults[0].uuid).toEqual(eventUuid)

    // Ensure the new private api key cannot be used to create new workspaces
    const createWorkspaceRes = await authenticatedPost('/workspaces', newPrivateApiKey).send({
      name: getRandomID(),
    })
    expect(createWorkspaceRes.statusCode).toEqual(401)
  })

  test('should update an existing workspace', async () => {
    // Create a new workspace
    const createRes = await authenticatedPost('/workspaces').send({
      name: getRandomID(),
      properties: { test: 'test' },
    })
    expect(createRes.statusCode).toEqual(201)
    const workspaceId = createRes.body.workspaceId
    expect(workspaceId).toBeDefined()

    // Update the workspace
    const updatedName = getRandomID()
    const updatedProperties = { test: 'test2' }
    const updateRes = await authenticatedPut(`/workspaces/${workspaceId}`).send({
      name: updatedName,
      properties: updatedProperties,
    })
    expect(updateRes.statusCode).toEqual(200)
    expect(updateRes.body.name).toEqual(updatedName)
    expect(updateRes.body.properties).toEqual(updatedProperties)
  })

  test('should delete an existing workspace', async () => {
    // Create a new workspace
    const createRes = await authenticatedPost('/workspaces').send({ name: getRandomID() })
    expect(createRes.statusCode).toEqual(201)
    const workspaceId = createRes.body.workspaceId

    // Delete the workspace
    const deleteRes = await authenticatedDelete(`/workspaces/${workspaceId}`)
    expect(deleteRes.statusCode).toEqual(200)

    // Verify the workspace has been deleted
    const getRes = await authenticatedGet(`/workspaces/${workspaceId}`)
    expect(getRes.statusCode).toEqual(404)
  })
})
