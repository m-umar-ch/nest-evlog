import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CheckoutNotification {
  @Field()
  channel: string;

  @Field()
  delivered: boolean;
}

@ObjectType()
export class AsyncJobInfo {
  @Field()
  correlationId: string;

  @Field({ nullable: true })
  jobId?: string;

  @Field()
  queue: string;
}

@ObjectType()
export class CheckoutResult {
  @Field()
  orderId: string;

  @Field()
  transactionId: string;

  @Field(() => Int)
  totalCents: number;

  @Field(() => CheckoutNotification)
  notification: CheckoutNotification;

  @Field(() => AsyncJobInfo)
  asyncJob: AsyncJobInfo;
}
