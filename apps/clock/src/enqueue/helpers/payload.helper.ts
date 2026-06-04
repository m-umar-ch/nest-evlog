import type {
  InventoryAlertJobPayload,
  JobFailureMode,
  NotificationDispatchJobPayload,
  OrderSyncJobPayload,
} from '@nest-evlog/queues';

export function buildOrderSyncPayload(
  correlationId: string,
  userId: string,
  source: OrderSyncJobPayload['source'],
  failureMode?: JobFailureMode,
): OrderSyncJobPayload {
  return { correlationId, userId, source, failureMode };
}

export function buildInventoryAlertPayload(
  correlationId: string,
  sku: string,
  currentStock: number,
  source: InventoryAlertJobPayload['source'],
  failureMode?: JobFailureMode,
): InventoryAlertJobPayload {
  return {
    correlationId,
    sku,
    threshold: 5,
    currentStock,
    source,
    failureMode,
  };
}

export function buildNotificationPayload(
  correlationId: string,
  userId: string,
  source: NotificationDispatchJobPayload['source'],
  failureMode?: JobFailureMode,
): NotificationDispatchJobPayload {
  return {
    correlationId,
    userId,
    channel: 'email',
    template: 'weekly-digest',
    source,
    failureMode,
  };
}
