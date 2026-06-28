import { Inject, Injectable, LoggerService as NestLoggerService } from '@nestjs/common'
import * as winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

import { WINSTON_LOGGER } from './logger.constants'
import { RequestContextService } from './request-context.service'
import { LoggerModuleOptions } from './types'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

// ── standalone factory: builds the underlying winston.Logger once ──────
// Exported so LoggerModule can wire it as a DI provider.
export function createWinstonLogger(options?: LoggerModuleOptions): winston.Logger {
  const logDir = options?.logDir ?? process.env['LOG_DIR'] ?? 'logs'
  const level = options?.level ?? process.env['LOG_LEVEL'] ?? 'info'

  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level: lvl, message, context, traceId, ...meta }) => {
      const ctx = (context as string | undefined) ?? 'API'
      const trace = traceId ? ' [' + String(traceId) + ']' : ''
      const extra = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''
      return String(timestamp) + ' ' + String(lvl) + ' [' + ctx + ']' + trace + ': ' + String(message) + extra
    })
  )

  const jsonFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston.format.json())

  const transports: winston.transport[] = [
    new winston.transports.Console({ format: consoleFormat }),
    new DailyRotateFile({
      dirname: logDir,
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: options?.maxSize ?? '20m',
      maxFiles: options?.maxFiles ?? '14d',
      format: jsonFormat,
    }),
    new DailyRotateFile({
      dirname: logDir,
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: options?.maxSize ?? '20m',
      maxFiles: options?.errorMaxFiles ?? '30d',
      level: 'error',
      format: jsonFormat,
    }),
  ]

  return winston.createLogger({ level, transports })
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private contextName?: string

  constructor(
    @Inject(WINSTON_LOGGER) private readonly logger: winston.Logger,
    private readonly requestContext: RequestContextService
  ) {}

  setContext(context: string): void {
    this.contextName = context
  }

  /**
   * Return a lightweight child logger pre-configured with `context`.
   *
   * The child shares the **same** winston.Logger instance (transports, format),
   * so there is zero overhead — only the context label differs.
   */
  child(context: string): LoggerService {
    const child = new LoggerService(this.logger, this.requestContext)
    child.contextName = context
    return child
  }

  // ── NestJS-style param helpers ─────────────────────────────────────────

  private resolveMeta(
    optionalParams: unknown[],
    defaultContext: string | undefined
  ): { context: string | undefined; meta: Record<string, unknown> } {
    if (optionalParams.length === 0) {
      return { context: defaultContext, meta: {} }
    }

    const [first, second] = optionalParams

    if (isPlainObject(first)) {
      const obj = first as Record<string, unknown>
      const ctx = (obj['context'] as string | undefined) ?? defaultContext
      return { context: ctx, meta: obj }
    }

    if (typeof first === 'string') {
      if (typeof second === 'string') {
        return { context: second, meta: { stack: first } }
      }
      return { context: first, meta: {} }
    }

    return { context: defaultContext, meta: {} }
  }

  private getTraceId(): string | undefined {
    return this.requestContext.getTraceId()
  }

  // ── LoggerService interface ────────────────────────────────────────────

  private write(
    level: string,
    message: unknown,
    traceId: string | undefined,
    context: string | undefined,
    meta: Record<string, unknown>
  ): void {
    this.logger.log(level, message as string, { traceId, context, ...meta } as any)
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    const { context, meta } = this.resolveMeta(optionalParams, this.contextName)
    this.write('info', message, this.getTraceId(), context, meta)
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    const { context, meta } = this.resolveMeta(optionalParams, this.contextName)
    this.write('error', message, this.getTraceId(), context, meta)
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    const { context, meta } = this.resolveMeta(optionalParams, this.contextName)
    this.write('warn', message, this.getTraceId(), context, meta)
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    const { context, meta } = this.resolveMeta(optionalParams, this.contextName)
    this.write('debug', message, this.getTraceId(), context, meta)
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    const { context, meta } = this.resolveMeta(optionalParams, this.contextName)
    this.write('verbose', message, this.getTraceId(), context, meta)
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    const { context, meta } = this.resolveMeta(optionalParams, this.contextName)
    this.write('error', '[FATAL] ' + String(message), this.getTraceId(), context, meta)
  }
}
