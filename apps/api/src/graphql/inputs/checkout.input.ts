import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CheckoutItemInput {
  @Field()
  sku: string;

  @Field(() => Int)
  quantity: number;
}

@InputType()
export class CheckoutCardInput {
  @Field()
  last4: string;

  @Field()
  brand: string;

  @Field(() => Int)
  expiryMonth: number;

  @Field(() => Int)
  expiryYear: number;
}

@InputType()
export class CheckoutInput {
  @Field()
  userId: string;

  @Field(() => [CheckoutItemInput])
  items: CheckoutItemInput[];

  @Field(() => CheckoutCardInput)
  card: CheckoutCardInput;
}
