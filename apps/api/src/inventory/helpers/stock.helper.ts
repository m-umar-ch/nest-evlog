import { createError } from 'evlog';
import type { Product } from '../inventory.types';

export function canFulfillOrder(
  product: Product,
  quantity: number,
): boolean {
  return product.stock >= quantity;
}

export function calculateReservedStock(
  currentStock: number,
  quantity: number,
): number {
  return currentStock - quantity;
}

export function buildStockSnapshot(products: Product[]) {
  return products.map((product) => ({
    sku: product.sku,
    available: product.stock,
  }));
}

export function assertStockAvailable(
  product: Product,
  quantity: number,
): void {
  if (!canFulfillOrder(product, quantity)) {
    throw createError({
      message: `Insufficient stock for ${product.name}`,
      status: 409,
      why: `Requested ${quantity}, only ${product.stock} available for ${product.sku}`,
      fix: 'Reduce quantity or choose a different product',
    });
  }
}
