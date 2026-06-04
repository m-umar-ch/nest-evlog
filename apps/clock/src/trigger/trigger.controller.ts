import { Body, Controller, Post } from '@nestjs/common';
import { useLogger } from 'evlog/nestjs';
import { EnqueueService } from '../enqueue/enqueue.service';

@Controller('trigger')
export class TriggerController {
  constructor(private readonly enqueueService: EnqueueService) {}

  /** Manual enqueue — HTTP wide event + nested job logger wide event */
  @Post('order-sync')
  async triggerOrderSync(@Body() body: { userId?: string }) {
    const log = useLogger();
    log.set({ route: 'trigger.order_sync', trigger: 'manual' });

    const result = await this.enqueueService.enqueueOrderSync(
      body.userId ?? 'usr_alice',
      'manual',
    );

    log.set({ enqueue: result });
    return result;
  }

  @Post('inventory-alert')
  async triggerInventoryAlert(
    @Body() body: { sku?: string; currentStock?: number },
  ) {
    useLogger().set({ route: 'trigger.inventory_alert', trigger: 'manual' });

    return this.enqueueService.enqueueInventoryAlert(
      body.sku ?? 'sku_webcam',
      body.currentStock ?? 0,
    );
  }

  @Post('notification')
  async triggerNotification(@Body() body: { userId?: string }) {
    useLogger().set({ route: 'trigger.notification', trigger: 'manual' });

    return this.enqueueService.enqueueNotificationDispatch(
      body.userId ?? 'usr_carol',
    );
  }
}
