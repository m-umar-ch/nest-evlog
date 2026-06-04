import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { JobsModule } from '../jobs/jobs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';
import { PricingModule } from '../pricing/pricing.module';
import { UsersModule } from '../users/users.module';
import { CheckoutResolver } from './checkout.resolver';
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
  providers: [CheckoutService, CheckoutResolver],
})
export class CheckoutModule {}
