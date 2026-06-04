import { Body, Controller, Post } from '@nestjs/common';
import { useLogger } from 'evlog/nestjs';
import type { JobFailureMode } from '@nest-evlog/queues';
import { EnqueueService } from '../enqueue/enqueue.service';

interface TriggerBody {
  userId?: string;
  sku?: string;
  currentStock?: number;
  /** Force failure in clock (before enqueue) or worker (after dequeue). */
  fail?: JobFailureMode;
}

@Controller('trigger')
export class TriggerController {
  constructor(private readonly enqueueService: EnqueueService) {}

  @Post('order-sync')
  async triggerOrderSync(@Body() body: TriggerBody) {
    const log = useLogger();
    log.set({
      route: 'trigger.order_sync',
      trigger: 'manual',
      fail: body.fail ?? 'none',
    });

    const result = await this.enqueueService.enqueueOrderSync(
      body.userId ?? 'usr_alice',
      'manual',
      body.fail,
    );

    log.set({ enqueue: result });
    return result;
  }

  @Post('inventory-alert')
  async triggerInventoryAlert(@Body() body: TriggerBody) {
    useLogger().set({
      route: 'trigger.inventory_alert',
      trigger: 'manual',
      fail: body.fail ?? 'none',
    });

    return this.enqueueService.enqueueInventoryAlert(
      body.sku ?? 'sku_webcam',
      body.currentStock ?? 0,
      'manual',
      body.fail,
    );
  }

  @Post('notification')
  async triggerNotification(@Body() body: TriggerBody) {
    useLogger().set({
      route: 'trigger.notification',
      trigger: 'manual',
      fail: body.fail ?? 'none',
    });

    return this.enqueueService.enqueueNotificationDispatch(
      body.userId ?? 'usr_carol',
      'manual',
      body.fail,
    );
  }
}
