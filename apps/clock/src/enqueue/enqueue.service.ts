import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { runWithJobLogger, setJobStep } from '@nest-evlog/job-logging';
import {
  QUEUES,
  assertEnqueueShouldSucceed,
  generateCorrelationId,
  type InventoryAlertJobPayload,
  type JobFailureMode,
  type NotificationDispatchJobPayload,
  type OrderSyncJobPayload,
  type ProducerWideEventContext,
} from '@nest-evlog/queues';
import {
  buildInventoryAlertPayload,
  buildNotificationPayload,
  buildOrderSyncPayload,
} from './helpers/payload.helper';

const FAILING_JOB_OPTIONS = {
  attempts: 2,
  removeOnComplete: 100,
  removeOnFail: 50,
};

export interface EnqueueOptions {
  failureMode?: JobFailureMode;
  producer?: ProducerWideEventContext;
}

@Injectable()
export class EnqueueService {
  constructor(
    @InjectQueue(QUEUES.ORDER_SYNC)
    private readonly orderSyncQueue: Queue<OrderSyncJobPayload>,
    @InjectQueue(QUEUES.INVENTORY_ALERT)
    private readonly inventoryAlertQueue: Queue<InventoryAlertJobPayload>,
    @InjectQueue(QUEUES.NOTIFICATION_DISPATCH)
    private readonly notificationQueue: Queue<NotificationDispatchJobPayload>,
  ) {}

  async enqueueOrderSync(
    userId: string,
    source: OrderSyncJobPayload['source'],
    options?: EnqueueOptions,
  ) {
    const correlationId = generateCorrelationId();
    const failureMode = options?.failureMode;

    return runWithJobLogger(
      {
        app: 'clock',
        operation: 'enqueue.order_sync',
        correlationId,
        queue: QUEUES.ORDER_SYNC,
        failureMode: failureMode ?? 'none',
      },
      async (log) => {
        const payload = buildOrderSyncPayload(correlationId, userId, source, {
          failureMode,
          producer: options?.producer,
        });
        setJobStep(log, 'build_payload', { userId, source, failureMode });

        assertEnqueueShouldSucceed(payload);
        setJobStep(log, 'validate_enqueue');

        const job = await this.orderSyncQueue.add('sync', payload, {
          jobId: correlationId,
          ...(failureMode === 'worker' ? FAILING_JOB_OPTIONS : {}),
        });

        log.set({
          bullmq: { jobId: job.id, queue: QUEUES.ORDER_SYNC },
          payload,
        });

        return { correlationId, jobId: job.id };
      },
    );
  }

  async enqueueInventoryAlert(
    sku: string,
    currentStock: number,
    source: InventoryAlertJobPayload['source'] = 'cron',
    options?: EnqueueOptions,
  ) {
    const correlationId = generateCorrelationId();
    const failureMode = options?.failureMode;

    return runWithJobLogger(
      {
        app: 'clock',
        operation: 'enqueue.inventory_alert',
        correlationId,
        queue: QUEUES.INVENTORY_ALERT,
        failureMode: failureMode ?? 'none',
      },
      async (log) => {
        const payload = buildInventoryAlertPayload(
          correlationId,
          sku,
          currentStock,
          source,
          { failureMode, producer: options?.producer },
        );
        setJobStep(log, 'build_payload', { sku, currentStock, failureMode });

        assertEnqueueShouldSucceed({ ...payload, userId: undefined });
        setJobStep(log, 'validate_enqueue');

        const job = await this.inventoryAlertQueue.add('alert', payload, {
          jobId: correlationId,
          ...(failureMode === 'worker' ? FAILING_JOB_OPTIONS : {}),
        });

        log.set({
          bullmq: { jobId: job.id, queue: QUEUES.INVENTORY_ALERT },
          payload,
        });

        return { correlationId, jobId: job.id };
      },
    );
  }

  async enqueueNotificationDispatch(
    userId: string,
    source: NotificationDispatchJobPayload['source'] = 'cron',
    options?: EnqueueOptions,
  ) {
    const correlationId = generateCorrelationId();
    const failureMode = options?.failureMode;

    return runWithJobLogger(
      {
        app: 'clock',
        operation: 'enqueue.notification_dispatch',
        correlationId,
        queue: QUEUES.NOTIFICATION_DISPATCH,
        failureMode: failureMode ?? 'none',
      },
      async (log) => {
        const payload = buildNotificationPayload(
          correlationId,
          userId,
          source,
          { failureMode, producer: options?.producer },
        );
        setJobStep(log, 'build_payload', { userId, failureMode });

        assertEnqueueShouldSucceed(payload);
        setJobStep(log, 'validate_enqueue');

        const job = await this.notificationQueue.add('dispatch', payload, {
          jobId: correlationId,
          ...(failureMode === 'worker' ? FAILING_JOB_OPTIONS : {}),
        });

        log.set({
          bullmq: { jobId: job.id, queue: QUEUES.NOTIFICATION_DISPATCH },
          payload,
        });

        return { correlationId, jobId: job.id };
      },
    );
  }
}
