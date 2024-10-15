import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { AppModule } from '../../src/app.module'
import { EventsModule } from '../../src/events/events.module'
import { RedisModule } from '../../src/services/data/redis/redis.module'
import { RedisService } from '../../src/services/data/redis/redis.service'

describe('events/', () => {
  let app: INestApplication
  afterAll(async () => {
    await app.close()
  })

  beforeAll(async () => {
    const redisService = new RedisService()
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [EventsModule, RedisModule, AppModule],
    })
      .overrideProvider(RedisService)
      .useValue(redisService)
      .compile()

    jest.spyOn(redisService, 'onModuleInit').mockImplementation(async () => {})

    app = testModule.createNestApplication()
    await app.init()
  })

  test('should return a 201 on /events/ with userid and identify', async () => {
    const res = await request(app.getHttpServer())
      .post('/events/')
      .send({ userid: '12345', type: 'identify' })
    expect(res.statusCode).toEqual(201)
  })
})
