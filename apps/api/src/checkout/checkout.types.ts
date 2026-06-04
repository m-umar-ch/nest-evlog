export interface CheckoutItemDto {
  sku: string;
  quantity: number;
}

export interface CheckoutCardDto {
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
}

export interface CheckoutDto {
  userId: string;
  items: CheckoutItemDto[];
  card: CheckoutCardDto;
}

export interface CheckoutResult {
  orderId: string;
  transactionId: string;
  totalCents: number;
  notification: {
    channel: string;
    delivered: boolean;
  };
}
