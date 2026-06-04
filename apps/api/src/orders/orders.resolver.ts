import { Args, Query, Resolver } from '@nestjs/graphql';
import { useLogger } from 'evlog/nestjs';
import { Order } from '../graphql/models/order.model';
import { OrdersService } from './orders.service';

@Resolver(() => Order)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Query(() => Order, { name: 'order' })
  findOne(@Args('id', { type: () => String }) id: string): Order {
    useLogger().set({ graphql: { operation: 'order', orderId: id } });
    return this.ordersService.findById(id) as Order;
  }
}
