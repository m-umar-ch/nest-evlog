import { registerEnumType } from '@nestjs/graphql';

export enum UserPlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

registerEnumType(UserPlan, { name: 'UserPlan' });
