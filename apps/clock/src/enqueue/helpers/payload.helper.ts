import type {
  InventoryAlertJobPayload,
  NotificationDispatchJobPayload,
  OrderSyncJobPayload,
} from '@nest-evlog/queues';

export function buildOrderSyncPayload(
  correlationId: string,
  userId: string,
  source: OrderSyncJobPayload['source'],
): OrderSyncJobPayload {
  return { correlationId, userId, source };
}

export function buildInventoryAlertPayload(
  correlationId: string,
  sku: string,
  currentStock: number,
  source: InventoryAlertJobPayload['source'],
): InventoryAlertJobPayload {
  return {
    correlationId,
    sku,
    threshold: 5,
    currentStock,
    source,
  };
}

export function buildNotificationPayload(
  correlationId: string,
  userId: string,
  source: NotificationDispatchJobPayload['source'],
): NotificationDispatchJobPayload {
  return {
    correlationId,
    userId,
    channel: 'email',
    template: 'weekly-digest',
    source,
  };
}
