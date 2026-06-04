import { Injectable } from '@nestjs/common';
import { useLogger } from 'evlog/nestjs';
import { createError } from 'evlog';
import { PRODUCTS } from './inventory.data';
import {
  assertStockAvailable,
  buildStockSnapshot,
  calculateReservedStock,
} from './helpers/stock.helper';
import type { Reservation } from './inventory.types';

export interface LineItem {
  sku: string;
  quantity: number;
}

@Injectable()
export class InventoryService {
  private readonly stock = new Map(
    PRODUCTS.map((product) => [product.sku, product.stock]),
  );

  getProduct(sku: string) {
    const product = PRODUCTS.find((entry) => entry.sku === sku);
    if (!product) {
      throw createError({
        message: 'Product not found',
        status: 404,
        why: `No product with sku "${sku}"`,
        fix: 'Use a valid SKU like sku_keyboard',
      });
    }
    return { ...product, stock: this.stock.get(sku) ?? 0 };
  }

  reserveItems(items: LineItem[]): Reservation[] {
    const log = useLogger();
    log.set({ inventory: { itemsRequested: items.length } });

    const reservations: Reservation[] = [];

    for (const item of items) {
      const product = this.getProduct(item.sku);
      assertStockAvailable(product, item.quantity);

      const newStock = calculateReservedStock(product.stock, item.quantity);
      this.stock.set(item.sku, newStock);

      reservations.push({
        sku: item.sku,
        quantity: item.quantity,
        reservedAt: new Date().toISOString(),
      });
    }

    log.set({
      inventory: {
        reservations: reservations.map((r) => ({
          sku: r.sku,
          quantity: r.quantity,
        })),
        stockAfter: buildStockSnapshot(
          PRODUCTS.map((p) => ({
            ...p,
            stock: this.stock.get(p.sku) ?? 0,
          })),
        ),
      },
    });

    return reservations;
  }

  releaseReservation(items: LineItem[]): void {
    for (const item of items) {
      const current = this.stock.get(item.sku) ?? 0;
      this.stock.set(item.sku, current + item.quantity);
    }

    useLogger().set({ inventory: { reservationReleased: true } });
  }
}
