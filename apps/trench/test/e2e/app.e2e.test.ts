import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { AppModule } from '../../src/app.module'
import { EventsModule } from '../../src/events/events.module'
import { authenticatedGet } from './utils'

describe('/', () => {
  test('should return a 200 on /', async () => {
    const res = await authenticatedGet('/')
    expect(res.statusCode).toEqual(200)
  })
})
