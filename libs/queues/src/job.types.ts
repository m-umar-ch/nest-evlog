export type JobSource = 'cron' | 'manual' | 'api';

export interface OrderSyncJobPayload {
  correlationId: string;
  userId: string;
  orderId?: string;
  source: JobSource;
}

export interface InventoryAlertJobPayload {
  correlationId: string;
  sku: string;
  threshold: number;
  currentStock: number;
  source: JobSource;
}

export interface NotificationDispatchJobPayload {
  correlationId: string;
  userId: string;
  channel: 'email' | 'email+sms';
  template: string;
  source: JobSource;
}
