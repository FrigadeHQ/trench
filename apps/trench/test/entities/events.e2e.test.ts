import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { AppModule } from '../../src/app.module'
import { EventsModule } from '../../src/events/events.module'
import { authenticatedGet, authenticatedPost } from './utils'

describe('events/', () => {
  async function waitForResults(query: string) {
    const pollInterval = 100 // 100 ms
    const maxWaitTime = 10000 // 10 seconds
    const startTime = Date.now()

    while (true) {
      const res = await authenticatedGet(`/events?${query}`)
      if (res.body.results && res.body.results.length > 0) {
        return res.body.results
      }
      if (Date.now() - startTime > maxWaitTime) {
        throw new Error(`Timeout: No results found within ${maxWaitTime / 1000} seconds`)
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval))
    }
  }

  test('should create a new event and fetch it', async () => {
    const newEvent = {
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      type: 'track',
      event: 'User SignedUp',
      timestamp: new Date().toISOString(),
    }

    // Create a new event
    const createRes = await authenticatedPost('/events').send({ events: [newEvent] })
    expect(createRes.statusCode).toEqual(201)
    expect(createRes.body.results).toHaveLength(1)
    expect(createRes.body.results[0].uuid).toBeDefined()
    const eventUuid = createRes.body.results[0].uuid

    // Fetch the created event using the newly created util function
    const results = await waitForResults(`uuid=${eventUuid}`)
    expect(results).toHaveLength(1)
    expect(results[0].uuid).toEqual(eventUuid)
  })
})
