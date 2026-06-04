export interface CardDetails {
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
}

export interface PaymentResult {
  transactionId: string;
  amountCents: number;
  status: 'authorized' | 'declined';
  processedAt: string;
}

export function maskCardNumber(last4: string): string {
  return `****-****-****-${last4}`;
}

export function isCardExpired(month: number, year: number): boolean {
  const now = new Date();
  const expiry = new Date(year, month, 0);
  return expiry < now;
}

export function validateCardBrand(brand: string): boolean {
  const allowed = ['visa', 'mastercard', 'amex'];
  return allowed.includes(brand.toLowerCase());
}

export function simulateAuthorization(
  amountCents: number,
  last4: string,
): 'authorized' | 'declined' {
  if (last4 === '0000') {
    return 'declined';
  }
  if (amountCents > 500_000) {
    return 'declined';
  }
  return 'authorized';
}
