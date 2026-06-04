import { Injectable } from '@nestjs/common';
import { useLogger } from 'evlog/nestjs';
import {
  assertNonEmpty,
  assertPositive,
} from '../common/helpers/validation.helper';
import type { LineItem } from '../inventory/inventory.service';
import { InventoryService } from '../inventory/inventory.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from '../payments/payments.service';
import { PricingService } from '../pricing/pricing.service';
import { UsersService } from '../users/users.service';
import type { CheckoutDto, CheckoutResult } from './checkout.types';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly usersService: UsersService,
    private readonly inventoryService: InventoryService,
    private readonly pricingService: PricingService,
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async processCheckout(dto: CheckoutDto): Promise<CheckoutResult> {
    const log = useLogger();

    this.validateCheckoutDto(dto);

    log.set({
      checkout: {
        userId: dto.userId,
        itemCount: dto.items.length,
        skus: dto.items.map((item) => item.sku),
      },
    });

    const user = this.usersService.validateForCheckout(dto.userId);
    const lineItems = this.normalizeLineItems(dto.items);

    let reservations;
    try {
      reservations = this.inventoryService.reserveItems(lineItems);
      log.set({ checkout: { inventoryReserved: reservations.length } });

      const pricing = this.pricingService.calculateOrderTotal(lineItems, user);
      const payment = this.paymentsService.charge(pricing.totalCents, dto.card);

      const order = this.ordersService.createOrder({
        userId: user.id,
        items: pricing.lineItems.map((line) => ({
          sku: line.sku,
          quantity: line.quantity,
          lineTotalCents: line.lineTotalCents,
        })),
        subtotalCents: pricing.subtotalCents,
        discountCents: pricing.discountCents,
        taxCents: pricing.taxCents,
        totalCents: pricing.totalCents,
        transactionId: payment.transactionId,
      });

      const loyaltyPointsUsed = Math.min(
        user.loyaltyPoints,
        pricing.discountCents,
      );
      if (loyaltyPointsUsed > 0) {
        this.usersService.deductLoyaltyPoints(user.id, loyaltyPointsUsed);
      }

      const notification = this.notificationsService.sendOrderConfirmation(
        user,
        {
          orderId: order.id,
          totalCents: order.totalCents,
          itemCount: order.items.length,
        },
      );

      log.set({
        checkout: {
          completed: true,
          orderId: order.id,
          transactionId: payment.transactionId,
        },
      });

      return {
        orderId: order.id,
        transactionId: payment.transactionId,
        totalCents: order.totalCents,
        notification: {
          channel: notification.channel,
          delivered: notification.delivered,
        },
      };
    } catch (error) {
      if (reservations) {
        this.inventoryService.releaseReservation(lineItems);
        log.set({ checkout: { inventoryReleased: true } });
      }
      throw error;
    }
  }

  private validateCheckoutDto(dto: CheckoutDto): void {
    assertNonEmpty(dto.userId, 'userId');

    if (!dto.items?.length) {
      useLogger().set({ checkout: { validationFailed: 'empty_items' } });
      assertPositive(0, 'items');
    }

    for (const item of dto.items) {
      assertNonEmpty(item.sku, 'sku');
      assertPositive(item.quantity, 'quantity');
    }

    assertNonEmpty(dto.card?.last4, 'card.last4');
    assertNonEmpty(dto.card?.brand, 'card.brand');
    assertPositive(dto.card?.expiryMonth, 'card.expiryMonth');
    assertPositive(dto.card?.expiryYear, 'card.expiryYear');
  }

  private normalizeLineItems(items: CheckoutDto['items']): LineItem[] {
    return items.map((item) => ({
      sku: item.sku,
      quantity: item.quantity,
    }));
  }
}
