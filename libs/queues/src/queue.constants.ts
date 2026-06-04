export const QUEUES = {
  ORDER_SYNC: 'order-sync',
  INVENTORY_ALERT: 'inventory-alert',
  NOTIFICATION_DISPATCH: 'notification-dispatch',
  /** Enqueued by API after checkout — carries API wide-event snapshot for worker. */
  POST_CHECKOUT: 'post-checkout',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export const ALL_QUEUES: QueueName[] = Object.values(QUEUES);
