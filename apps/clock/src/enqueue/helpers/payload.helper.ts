import type {
  InventoryAlertJobPayload,
  JobFailureMode,
  NotificationDispatchJobPayload,
  OrderSyncJobPayload,
  ProducerWideEventContext,
} from '@nest-evlog/queues';

export function buildOrderSyncPayload(
  correlationId: string,
  userId: string,
  source: OrderSyncJobPayload['source'],
  options?: { failureMode?: JobFailureMode; producer?: ProducerWideEventContext },
): OrderSyncJobPayload {
  return {
    correlationId,
    userId,
    source,
    failureMode: options?.failureMode,
    producer: options?.producer,
  };
}

export function buildInventoryAlertPayload(
  correlationId: string,
  sku: string,
  currentStock: number,
  source: InventoryAlertJobPayload['source'],
  options?: { failureMode?: JobFailureMode; producer?: ProducerWideEventContext },
): InventoryAlertJobPayload {
  return {
    correlationId,
    sku,
    threshold: 5,
    currentStock,
    source,
    failureMode: options?.failureMode,
    producer: options?.producer,
  };
}

export function buildNotificationPayload(
  correlationId: string,
  userId: string,
  source: NotificationDispatchJobPayload['source'],
  options?: { failureMode?: JobFailureMode; producer?: ProducerWideEventContext },
): NotificationDispatchJobPayload {
  return {
    correlationId,
    userId,
    channel: 'email',
    template: 'weekly-digest',
    source,
    failureMode: options?.failureMode,
    producer: options?.producer,
  };
}
