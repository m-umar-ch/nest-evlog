import type { JobFailureMode } from './failure.constants';
import type { ProducerWideEventContext } from './producer-context.types';

export type JobSource = 'cron' | 'manual' | 'api';

export interface JobPayloadBase {
  correlationId: string;
  source: JobSource;
  failureMode?: JobFailureMode;
  /** Producer wide-event snapshot (API checkout, clock trigger, …). */
  producer?: ProducerWideEventContext;
}

export interface OrderSyncJobPayload extends JobPayloadBase {
  userId: string;
  orderId?: string;
}

export interface InventoryAlertJobPayload extends JobPayloadBase {
  sku: string;
  threshold: number;
  currentStock: number;
}

export interface NotificationDispatchJobPayload extends JobPayloadBase {
  userId: string;
  channel: 'email' | 'email+sms';
  template: string;
}

/** Created by API after POST /checkout — worker runs async fulfillment with parent context. */
export interface PostCheckoutJobPayload extends JobPayloadBase {
  source: 'api';
  orderId: string;
  userId: string;
  transactionId: string;
  totalCents: number;
  producer: ProducerWideEventContext;
}
