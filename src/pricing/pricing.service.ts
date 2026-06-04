import { Injectable } from '@nestjs/common';
import { useLogger } from 'evlog/nestjs';
import { formatCurrency } from '../common/helpers/money.helper';
import type { User } from '../users/users.types';
import {
  computePricing,
  type PricingResult,
} from './helpers/discount.helper';
import type { LineItem } from '../inventory/inventory.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class PricingService {
  constructor(private readonly inventoryService: InventoryService) {}

  calculateOrderTotal(
    items: LineItem[],
    user: User,
  ): PricingResult & { lineItems: Array<{ sku: string; unitPriceCents: number; quantity: number; lineTotalCents: number }> } {
    const log = useLogger();
    log.set({ pricing: { itemCount: items.length } });

    const lineItems = items.map((item) => {
      const product = this.inventoryService.getProduct(item.sku);
      const lineTotalCents = product.priceCents * item.quantity;
      return {
        sku: item.sku,
        unitPriceCents: product.priceCents,
        quantity: item.quantity,
        lineTotalCents,
      };
    });

    const subtotalCents = lineItems.reduce(
      (sum, line) => sum + line.lineTotalCents,
      0,
    );

    const pricing = computePricing({
      subtotalCents,
      user,
      itemCount: items.length,
    });

    log.set({
      pricing: {
        subtotal: formatCurrency(pricing.subtotalCents),
        discount: formatCurrency(pricing.discountCents),
        tax: formatCurrency(pricing.taxCents),
        total: formatCurrency(pricing.totalCents),
        discountReasons: pricing.discountReasons,
      },
    });

    return { ...pricing, lineItems };
  }
}
