import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { runWithJobLogger } from '@nest-evlog/job-logging';
import { EnqueueService } from '../enqueue/enqueue.service';

@Injectable()
export class CronJobsService {
  private readonly nestLogger = new Logger(CronJobsService.name);

  constructor(private readonly enqueueService: EnqueueService) {}

  /** Every minute — sync orders for demo user */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleOrderSyncCron() {
    this.nestLogger.debug('Running order-sync cron');

    await runWithJobLogger(
      { app: 'clock', operation: 'cron.order_sync' },
      async (log) => {
        log.set({ cron: { name: 'order_sync', schedule: 'EVERY_MINUTE' } });
        const result = await this.enqueueService.enqueueOrderSync(
          'usr_alice',
          'cron',
        );
        log.set({ cron: { enqueued: true, ...result } });
      },
    );
  }

  /** Every 2 minutes — low-stock alert for webcam SKU */
  @Cron('0 */2 * * * *')
  async handleInventoryAlertCron() {
    this.nestLogger.debug('Running inventory-alert cron');

    await runWithJobLogger(
      { app: 'clock', operation: 'cron.inventory_alert' },
      async (log) => {
        log.set({
          cron: { name: 'inventory_alert', schedule: 'every_2_minutes' },
        });
        const result = await this.enqueueService.enqueueInventoryAlert(
          'sku_webcam',
          0,
        );
        log.set({ cron: { enqueued: true, ...result } });
      },
    );
  }

  /** Every 5 minutes — notification digest */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleNotificationCron() {
    this.nestLogger.debug('Running notification-dispatch cron');

    await runWithJobLogger(
      { app: 'clock', operation: 'cron.notification_dispatch' },
      async (log) => {
        log.set({
          cron: { name: 'notification_dispatch', schedule: 'EVERY_5_MINUTES' },
        });
        const result = await this.enqueueService.enqueueNotificationDispatch(
          'usr_carol',
        );
        log.set({ cron: { enqueued: true, ...result } });
      },
    );
  }
}
