import { Controller, Get, Query } from '@nestjs/common'

import { OrderService } from './order.service'

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  async create(@Query('amount') amount: string, @Query('product') product: string) {
    return this.orderService.create(Number(amount), product)
  }
}
