export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  items: Array<{ sku: string; quantity: number; lineTotalCents: number }>;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  transactionId: string;
  createdAt: string;
}

export function nextStatus(current: OrderStatus): OrderStatus {
  const transitions: Record<OrderStatus, OrderStatus> = {
    pending: 'confirmed',
    confirmed: 'processing',
    processing: 'shipped',
    shipped: 'shipped',
    cancelled: 'cancelled',
  };
  return transitions[current];
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return status === 'shipped' || status === 'cancelled';
}

export function summarizeOrder(order: Order) {
  return {
    id: order.id,
    status: order.status,
    itemCount: order.items.length,
    totalCents: order.totalCents,
  };
}
