import { Module } from '@nestjs/common';
import { EvlogModule } from 'evlog/nestjs';
import { CheckoutModule } from './checkout/checkout.module';
import { GraphqlModule } from './graphql/graphql.module';
import { OrdersModule } from './orders/orders.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    EvlogModule.forRoot(),
    GraphqlModule,
    UsersModule,
    OrdersModule,
    CheckoutModule,
  ],
})
export class AppModule {}
