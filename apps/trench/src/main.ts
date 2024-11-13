import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { AppModule } from './app.module'
import * as fs from 'fs'
import * as process from 'process'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppClusterService } from './appCluster.service'
import { KafkaService } from './services/data/kafka/kafka.service'
import { ClickhouseService } from './services/data/clickhouse/clickhouse.service'

const CORS_OPTIONS = {
  origin: '*',
  allowedHeaders: [
    'Access-Control-Allow-Origin',
    'Origin',
    'X-Requested-With',
    'Accept',
    'Content-Type',
    'Authorization',
  ],
  exposedHeaders: ['Authorization'],
  credentials: true,
  methods: ['GET', 'PUT', 'OPTIONS', 'POST', 'DELETE'],
}

async function bootstrap(nodeNumber: number) {
  console.log(`Starting node ${nodeNumber}`)

  let httpsOptions

  if (process.env.API_HTTPS === 'true') {
    console.log('Using https')
    httpsOptions = {
      key: fs.readFileSync('/app/certs/server.key'),
      cert: fs.readFileSync('/app/certs/server.crt'),
    }
  } else {
    console.log('Using http')
  }

  const fastifyAdapter = new FastifyAdapter({ https: httpsOptions })
  fastifyAdapter.enableCors(CORS_OPTIONS)
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastifyAdapter)

  if (process.env.NODE_ENV === 'development') {
    const options = new DocumentBuilder().setTitle('trench API').setVersion('1.0').build()
    const document = SwaggerModule.createDocument(app, options)

    fs.writeFileSync('./swagger-spec.json', JSON.stringify(document))
    SwaggerModule.setup('/api', app, document)
  }

  const port = process.env.API_PORT ?? 4000

  if (nodeNumber === 1) {
    const kafkaService = app.get(KafkaService)
    await kafkaService.createTopicsIfNotExist()

    const clickhouseService = app.get(ClickhouseService)
    await clickhouseService.runMigrations()
  }

  console.log('Listening on port', port)
  await app.listen(port, '0.0.0.0')
}

if (process.env.NODE_ENV !== 'production') {
  console.log('Running in single instance dev mode')
  bootstrap(1)
} else {
  console.log('Running in cluster mode')
  AppClusterService.clusterize(bootstrap)
}
