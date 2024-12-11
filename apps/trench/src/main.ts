import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { AppModule } from './app.module'
import * as fs from 'fs'
import * as process from 'process'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppClusterService } from './appCluster.service'
import { KafkaService } from './services/data/kafka/kafka.service'
import { ClickHouseService } from './services/data/click-house/click-house.service'
import { BootstrapService } from './services/data/bootstrap/bootstrap.service'
import { Logger } from '@nestjs/common'
import * as os from 'os'

const logger = new Logger('Main')

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
  logger.log(`Starting node ${nodeNumber}`)

  let httpsOptions

  if (process.env.API_HTTPS === 'true') {
    logger.log('Using https')
    httpsOptions = {
      key: fs.readFileSync('/app/certs/server.key'),
      cert: fs.readFileSync('/app/certs/server.crt'),
    }
  } else {
    logger.log('Using http')
  }

  const fastifyAdapter = new FastifyAdapter({ https: httpsOptions, logger: true })
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
    const bootstrapService = app.get(BootstrapService)
    await bootstrapService.bootstrap()
  }

  logger.log(`Listening on port ${port}`)
  await app.listen(port, '0.0.0.0')
}

if (process.env.NODE_ENV !== 'production' && process.env.FORCE_CLUSTER_MODE !== 'true') {
  logger.log('Running in single instance dev mode')
  bootstrap(1)
} else {
  const numCPUs = os.cpus().length
  logger.log('Running in cluster mode with ' + numCPUs + ' processes')
  AppClusterService.clusterize(bootstrap)
}
