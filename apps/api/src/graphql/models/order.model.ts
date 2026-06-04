import { Field, Int, ObjectType } from '@nestjs/graphql';
import { OrderStatusGql } from '../enums/order-status.enum';

@ObjectType()
export class OrderLineItem {
  @Field()
  sku: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Int)
  lineTotalCents: number;
}

@ObjectType()
export class Order {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field(() => OrderStatusGql)
  status: OrderStatusGql;

  @Field(() => [OrderLineItem])
  items: OrderLineItem[];

  @Field(() => Int)
  subtotalCents: number;

  @Field(() => Int)
  discountCents: number;

  @Field(() => Int)
  taxCents: number;

  @Field(() => Int)
  totalCents: number;

  @Field()
  transactionId: string;

  @Field()
  createdAt: string;
}
