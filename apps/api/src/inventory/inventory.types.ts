export interface Product {
  sku: string;
  name: string;
  priceCents: number;
  stock: number;
}

export interface Reservation {
  sku: string;
  quantity: number;
  reservedAt: string;
}
