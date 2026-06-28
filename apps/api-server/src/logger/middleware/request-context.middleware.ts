import { randomUUID } from 'node:crypto'

import { Injectable, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'

import { RequestContextService } from '../request-context.service'

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly context: RequestContextService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const traceId = (req.headers['x-request-id'] as string) || (req.headers['x-trace-id'] as string) || randomUUID()

    this.context.run({ traceId }, () => next())
  }
}
