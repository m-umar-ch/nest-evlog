import { Injectable } from '@nestjs/common';
import { createError } from 'evlog';
import { useLogger } from 'evlog/nestjs';
import { generateId } from '../common/helpers/id.helper';
import {
  nextStatus,
  summarizeOrder,
  type Order,
  type OrderStatus,
} from './helpers/order-status.helper';

export interface CreateOrderInput {
  userId: string;
  items: Array<{ sku: string; quantity: number; lineTotalCents: number }>;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  transactionId: string;
}

@Injectable()
export class OrdersService {
  private readonly orders = new Map<string, Order>();

  createOrder(input: CreateOrderInput): Order {
    const log = useLogger();
    const order: Order = {
      id: generateId('ord'),
      userId: input.userId,
      status: 'confirmed',
      items: input.items,
      subtotalCents: input.subtotalCents,
      discountCents: input.discountCents,
      taxCents: input.taxCents,
      totalCents: input.totalCents,
      transactionId: input.transactionId,
      createdAt: new Date().toISOString(),
    };

    this.orders.set(order.id, order);

    log.set({
      order: summarizeOrder(order),
    });

    return order;
  }

  findById(id: string): Order {
    const log = useLogger();
    log.set({ order: { id } });

    const order = this.orders.get(id);
    if (!order) {
      throw createError({
        message: 'Order not found',
        status: 404,
        why: `No order with id "${id}"`,
        fix: 'Verify the order ID from your confirmation email',
      });
    }

    log.set({ order: summarizeOrder(order) });
    return order;
  }

  advanceStatus(orderId: string): OrderStatus {
    const order = this.findById(orderId);
    const newStatus = nextStatus(order.status);
    order.status = newStatus;

    useLogger().set({
      order: { id: orderId, status: newStatus },
    });

    return newStatus;
  }
}
