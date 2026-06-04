import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { runWithJobLogger, setJobStep } from '@nest-evlog/job-logging';
import {
  QUEUES,
  type InventoryAlertJobPayload,
  type NotificationDispatchJobPayload,
  type OrderSyncJobPayload,
} from '@nest-evlog/queues';
import { generateCorrelationId } from '../common/id.helper';
import {
  buildInventoryAlertPayload,
  buildNotificationPayload,
  buildOrderSyncPayload,
} from './helpers/payload.helper';

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

  async enqueueOrderSync(userId: string, source: OrderSyncJobPayload['source']) {
    const correlationId = generateCorrelationId();

    return runWithJobLogger(
      {
        app: 'clock',
        operation: 'enqueue.order_sync',
        correlationId,
        queue: QUEUES.ORDER_SYNC,
      },
      async (log) => {
        const payload = buildOrderSyncPayload(correlationId, userId, source);
        setJobStep(log, 'build_payload', { userId, source });

        const job = await this.orderSyncQueue.add('sync', payload, {
          jobId: correlationId,
        });

        log.set({
          bullmq: { jobId: job.id, queue: QUEUES.ORDER_SYNC },
          payload,
        });

        return { correlationId, jobId: job.id };
      },
    );
  }

  async enqueueInventoryAlert(sku: string, currentStock: number) {
    const correlationId = generateCorrelationId();

    return runWithJobLogger(
      {
        app: 'clock',
        operation: 'enqueue.inventory_alert',
        correlationId,
        queue: QUEUES.INVENTORY_ALERT,
      },
      async (log) => {
        const payload = buildInventoryAlertPayload(
          correlationId,
          sku,
          currentStock,
          'cron',
        );
        setJobStep(log, 'build_payload', { sku, currentStock });

        const job = await this.inventoryAlertQueue.add('alert', payload, {
          jobId: correlationId,
        });

        log.set({
          bullmq: { jobId: job.id, queue: QUEUES.INVENTORY_ALERT },
          payload,
        });

        return { correlationId, jobId: job.id };
      },
    );
  }

  async enqueueNotificationDispatch(userId: string) {
    const correlationId = generateCorrelationId();

    return runWithJobLogger(
      {
        app: 'clock',
        operation: 'enqueue.notification_dispatch',
        correlationId,
        queue: QUEUES.NOTIFICATION_DISPATCH,
      },
      async (log) => {
        const payload = buildNotificationPayload(
          correlationId,
          userId,
          'cron',
        );
        setJobStep(log, 'build_payload', { userId });

        const job = await this.notificationQueue.add('dispatch', payload, {
          jobId: correlationId,
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
