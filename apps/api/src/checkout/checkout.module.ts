import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { JobsModule } from '../jobs/jobs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';
import { PricingModule } from '../pricing/pricing.module';
import { UsersModule } from '../users/users.module';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';

@Module({
  imports: [
    UsersModule,
    InventoryModule,
    PricingModule,
    PaymentsModule,
    OrdersModule,
    NotificationsModule,
    JobsModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
