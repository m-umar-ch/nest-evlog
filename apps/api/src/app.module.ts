import { Module } from '@nestjs/common';
import { EvlogModule } from 'evlog/nestjs';
import { CheckoutModule } from './checkout/checkout.module';
import { HealthController } from './health.controller';
import { OrdersModule } from './orders/orders.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    EvlogModule.forRoot({
      exclude: ['/health'],
    }),
    UsersModule,
    OrdersModule,
    CheckoutModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
