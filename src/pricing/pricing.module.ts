import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { PricingService } from './pricing.service';

@Module({
  imports: [InventoryModule],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
