import { DynamicModule, Global, Module, Provider } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'

import { RequestLoggerInterceptor } from './interceptors/request-logger.interceptor'
import { LOGGER_MODULE_OPTIONS, WINSTON_LOGGER } from './logger.constants'
import { createWinstonLogger, LoggerService } from './logger.service'
import { RequestContextMiddleware } from './middleware/request-context.middleware'
import { RequestContextService } from './request-context.service'
import { LoggerModuleOptions } from './types'

@Global()
@Module({})
export class LoggerModule {
  static forRoot(options?: LoggerModuleOptions): DynamicModule {
    const providers: Provider[] = [
      { provide: LOGGER_MODULE_OPTIONS, useValue: options ?? {} },
      {
        provide: WINSTON_LOGGER,
        useFactory: (opts: LoggerModuleOptions) => createWinstonLogger(opts),
        inject: [LOGGER_MODULE_OPTIONS],
      },
      RequestContextService,
      LoggerService,
      { provide: APP_INTERCEPTOR, useClass: RequestLoggerInterceptor },
    ]

    return {
      module: LoggerModule,
      providers,
      exports: [LoggerService, RequestContextService, WINSTON_LOGGER],
    }
  }
}
