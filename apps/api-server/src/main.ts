import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'

import { AppModule } from './app.module'
import { LoggerService } from './logger/logger.service'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )

  // Use our logger as the NestJS application logger so all internal Nest
  // messages also get winston formatting + trace-id enrichment.
  const logger = app.get(LoggerService)
  logger.setContext('NestFactory')
  app.useLogger(logger)

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3001',
    credentials: true,
  })

  // Parse cookies into req.cookies without cookie-parser dependency
  app.use((req, _res, next) => {
    if (!req.cookies && req.headers.cookie) {
      const raw = req.headers.cookie
      const cookies: Record<string, string> = {}
      raw.split(';').forEach(pair => {
        const [key, ...rest] = pair.trim().split('=')
        if (key) cookies[key] = decodeURIComponent(rest.join('='))
      })
      req.cookies = cookies
    }
    next()
  })

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
