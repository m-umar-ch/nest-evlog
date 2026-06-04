import { Controller, Get, Param } from '@nestjs/common';
import { useLogger } from 'evlog/nestjs';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    useLogger().set({ route: 'orders.findOne' });
    return this.ordersService.findById(id);
  }
}
