import { Field, ObjectType } from '@nestjs/graphql';
import { UserPlan } from '../enums/user-plan.enum';

@ObjectType()
export class User {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => UserPlan)
  plan: UserPlan;

  @Field()
  loyaltyPoints: number;
}
