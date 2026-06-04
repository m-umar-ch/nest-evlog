import type { JobFailureMode } from './failure.constants';

export type JobSource = 'cron' | 'manual' | 'api';

export interface OrderSyncJobPayload {
  correlationId: string;
  userId: string;
  orderId?: string;
  source: JobSource;
  /** When set (or via demo userId), clock fails before enqueue or worker fails mid-job. */
  failureMode?: JobFailureMode;
}

export interface InventoryAlertJobPayload {
  correlationId: string;
  sku: string;
  threshold: number;
  currentStock: number;
  source: JobSource;
  failureMode?: JobFailureMode;
}

export interface NotificationDispatchJobPayload {
  correlationId: string;
  userId: string;
  channel: 'email' | 'email+sms';
  template: string;
  source: JobSource;
  failureMode?: JobFailureMode;
}
