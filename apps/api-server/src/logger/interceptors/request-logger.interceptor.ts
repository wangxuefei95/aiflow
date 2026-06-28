import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable, tap } from 'rxjs'

import { LoggerService } from '../logger.service'

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  private readonly log: LoggerService

  constructor(rootLogger: LoggerService) {
    this.log = rootLogger.child('HTTP')
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle()
    }

    const request = context.switchToHttp().getRequest()
    const { method, url, ip } = request
    const userAgent = request.headers['user-agent'] ?? '-'
    const startTime = Date.now()

    this.log.log(`→ ${method} ${url}`, { ip, userAgent })

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse()
          const duration = Date.now() - startTime
          this.log.log(`← ${method} ${url} ${response.statusCode} ${duration}ms`)
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime
          this.log.error(`← ${method} ${url} ${duration}ms — ${error.message}`, { name: error.name, stack: error.stack })
        },
      })
    )
  }
}
