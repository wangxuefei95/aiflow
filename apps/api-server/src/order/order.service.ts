import { Injectable } from '@nestjs/common'

import { LoggerService } from '../logger/logger.service'
import { PaymentService } from '../payment/payment.service'

@Injectable()
export class OrderService {
  private readonly log: LoggerService

  constructor(
    rootLogger: LoggerService,
    private readonly paymentService: PaymentService
  ) {
    this.log = rootLogger.child('OrderService')
  }

  async create(amount: number, product: string) {
    this.log.log('creating order', { amount, product })

    const charge = await this.paymentService.charge(amount)

    this.log.log('order created', {
      orderId: charge.id,
      status: charge.status,
    })

    return { orderId: charge.id, product, amount, status: charge.status }
  }
}
