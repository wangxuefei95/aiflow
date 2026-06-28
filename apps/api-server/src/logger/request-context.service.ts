import { AsyncLocalStorage } from 'node:async_hooks'

import { Injectable } from '@nestjs/common'

export interface RequestStore {
  traceId: string
  [key: string]: unknown
}

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestStore>()

  run(store: RequestStore, callback: () => void): void {
    this.storage.run(store, callback)
  }

  getTraceId(): string | undefined {
    return this.storage.getStore()?.traceId
  }

  getStore(): RequestStore | undefined {
    return this.storage.getStore()
  }
}
