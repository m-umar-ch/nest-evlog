import type { Product } from './inventory.types';

export const PRODUCTS: Product[] = [
  { sku: 'sku_keyboard', name: 'Mechanical Keyboard', priceCents: 12999, stock: 42 },
  { sku: 'sku_monitor', name: '4K Monitor', priceCents: 44999, stock: 15 },
  { sku: 'sku_webcam', name: 'HD Webcam', priceCents: 7999, stock: 0 },
  { sku: 'sku_headset', name: 'Wireless Headset', priceCents: 15999, stock: 28 },
];
