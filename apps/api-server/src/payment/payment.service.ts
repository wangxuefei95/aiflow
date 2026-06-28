import { Injectable } from '@nestjs/common'

import { LoggerService } from '../logger/logger.service'

@Injectable()
export class PaymentService {
  private readonly log: LoggerService

  constructor(rootLogger: LoggerService) {
    this.log = rootLogger.child('PaymentService')
  }

  async charge(amount: number) {
    this.log.log('processing payment', { amount })

    const id = 'ch_' + Math.random().toString(36).substring(2, 10)
    const status = amount > 0 ? 'paid' : 'failed'

    this.log.log('payment result', { chargeId: id, status })

    return { id, status }
  }
}
