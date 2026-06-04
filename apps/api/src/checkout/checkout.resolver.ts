import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { useLogger } from 'evlog/nestjs';
import { JoiValidationPipe } from '../common/validation/joi-validation.pipe';
import { CheckoutInput } from '../graphql/inputs/checkout.input';
import { CheckoutResult } from '../graphql/models/checkout.model';
import { checkoutDtoSchema } from './checkout.schema';
import { CheckoutService } from './checkout.service';
import type { CheckoutDto } from './checkout.types';

@Resolver()
export class CheckoutResolver {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Mutation(() => CheckoutResult, { name: 'checkout' })
  checkout(
    @Args(
      'input',
      { type: () => CheckoutInput },
      new JoiValidationPipe(checkoutDtoSchema),
    )
    input: CheckoutDto,
  ): Promise<CheckoutResult> {
    useLogger().set({ graphql: { operation: 'checkout', userId: input.userId } });
    return this.checkoutService.processCheckout(input);
  }
}
