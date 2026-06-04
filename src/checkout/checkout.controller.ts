import { Body, Controller, Post } from '@nestjs/common';
import { useLogger } from 'evlog/nestjs';
import { CheckoutService } from './checkout.service';
import type { CheckoutDto } from './checkout.types';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  checkout(@Body() dto: CheckoutDto) {
    useLogger().set({ route: 'checkout.process' });
    return this.checkoutService.processCheckout(dto);
  }
}
