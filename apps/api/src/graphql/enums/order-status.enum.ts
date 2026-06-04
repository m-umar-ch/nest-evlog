import { registerEnumType } from '@nestjs/graphql';

export enum OrderStatusGql {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  CANCELLED = 'cancelled',
}

registerEnumType(OrderStatusGql, { name: 'OrderStatus' });
