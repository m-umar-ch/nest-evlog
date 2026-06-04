import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { useLogger } from 'evlog/nestjs';
import { CheckoutInput } from '../graphql/inputs/checkout.input';
import { CheckoutResult } from '../graphql/models/checkout.model';
import { CheckoutService } from './checkout.service';
import type { CheckoutDto } from './checkout.types';

@Resolver()
export class CheckoutResolver {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Mutation(() => CheckoutResult, { name: 'checkout' })
  checkout(@Args('input') input: CheckoutInput): Promise<CheckoutResult> {
    useLogger().set({ graphql: { operation: 'checkout', userId: input.userId } });

    const dto: CheckoutDto = {
      userId: input.userId,
      items: input.items,
      card: input.card,
    };

    return this.checkoutService.processCheckout(dto);
  }
}
