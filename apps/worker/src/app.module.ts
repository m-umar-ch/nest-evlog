import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ALL_QUEUES, getRedisConnection } from '@nest-evlog/queues';
import { HealthController } from './health.controller';
import { InventoryAlertProcessor } from './processors/inventory-alert.processor';
import { NotificationDispatchProcessor } from './processors/notification-dispatch.processor';
import { OrderSyncProcessor } from './processors/order-sync.processor';
import { PostCheckoutProcessor } from './processors/post-checkout.processor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: getRedisConnection(),
    }),
    BullModule.registerQueue(...ALL_QUEUES.map((name) => ({ name }))),
  ],
  controllers: [HealthController],
  providers: [
    OrderSyncProcessor,
    InventoryAlertProcessor,
    NotificationDispatchProcessor,
    PostCheckoutProcessor,
  ],
})
export class AppModule {}
