import { Body, Controller, Post } from '@nestjs/common';
import { captureProducerWideEvent, type JobFailureMode } from '@nest-evlog/queues';
import { useLogger } from 'evlog/nestjs';
import { EnqueueService } from '../enqueue/enqueue.service';

interface TriggerBody {
  userId?: string;
  sku?: string;
  currentStock?: number;
  fail?: JobFailureMode;
}

@Controller('trigger')
export class TriggerController {
  constructor(private readonly enqueueService: EnqueueService) {}

  @Post('order-sync')
  async triggerOrderSync(@Body() body: TriggerBody) {
    const log = useLogger();
    const producer = captureProducerWideEvent(log, {
      service: 'nest-evlog-clock',
      method: 'POST',
      path: '/trigger/order-sync',
    });

    log.set({
      route: 'trigger.order_sync',
      trigger: 'manual',
      fail: body.fail ?? 'none',
    });

    const result = await this.enqueueService.enqueueOrderSync(
      body.userId ?? 'usr_alice',
      'manual',
      { failureMode: body.fail, producer },
    );

    log.set({ enqueue: result });
    return result;
  }

  @Post('inventory-alert')
  async triggerInventoryAlert(@Body() body: TriggerBody) {
    const log = useLogger();
    const producer = captureProducerWideEvent(log, {
      service: 'nest-evlog-clock',
      method: 'POST',
      path: '/trigger/inventory-alert',
    });

    log.set({
      route: 'trigger.inventory_alert',
      trigger: 'manual',
      fail: body.fail ?? 'none',
    });

    return this.enqueueService.enqueueInventoryAlert(
      body.sku ?? 'sku_webcam',
      body.currentStock ?? 0,
      'manual',
      { failureMode: body.fail, producer },
    );
  }

  @Post('notification')
  async triggerNotification(@Body() body: TriggerBody) {
    const log = useLogger();
    const producer = captureProducerWideEvent(log, {
      service: 'nest-evlog-clock',
      method: 'POST',
      path: '/trigger/notification',
    });

    log.set({
      route: 'trigger.notification',
      trigger: 'manual',
      fail: body.fail ?? 'none',
    });

    return this.enqueueService.enqueueNotificationDispatch(
      body.userId ?? 'usr_carol',
      'manual',
      { failureMode: body.fail, producer },
    );
  }
}
