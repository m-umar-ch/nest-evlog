import type { User } from '../../users/users.types';

export interface PricingInput {
  subtotalCents: number;
  user: User;
  itemCount: number;
}

export interface PricingResult {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  discountReasons: string[];
}

export function calculateTax(subtotalAfterDiscount: number): number {
  const taxRate = 0.0825;
  return Math.round(subtotalAfterDiscount * taxRate);
}

export function applyLoyaltyDiscount(
  subtotalCents: number,
  loyaltyPoints: number,
): { discountCents: number; reason: string | null } {
  const maxDiscount = Math.floor(loyaltyPoints / 10) * 100;
  const discountCents = Math.min(maxDiscount, Math.floor(subtotalCents * 0.15));

  if (discountCents <= 0) {
    return { discountCents: 0, reason: null };
  }

  return {
    discountCents,
    reason: `loyalty:${discountCents} cents from ${loyaltyPoints} points`,
  };
}

export function applyPlanDiscount(
  subtotalCents: number,
  plan: User['plan'],
): { discountCents: number; reason: string | null } {
  const rates: Record<User['plan'], number> = {
    free: 0,
    pro: 0.05,
    enterprise: 0.12,
  };

  const rate = rates[plan];
  if (rate === 0) {
    return { discountCents: 0, reason: null };
  }

  const discountCents = Math.round(subtotalCents * rate);
  return {
    discountCents,
    reason: `plan:${plan}:${rate * 100}%`,
  };
}

export function applyBulkDiscount(
  subtotalCents: number,
  itemCount: number,
): { discountCents: number; reason: string | null } {
  if (itemCount < 3) {
    return { discountCents: 0, reason: null };
  }

  const discountCents = Math.round(subtotalCents * 0.03);
  return {
    discountCents,
    reason: `bulk:${itemCount} items`,
  };
}

export function computePricing(input: PricingInput): PricingResult {
  const discountReasons: string[] = [];
  let discountCents = 0;

  const planDiscount = applyPlanDiscount(input.subtotalCents, input.user.plan);
  if (planDiscount.reason) {
    discountCents += planDiscount.discountCents;
    discountReasons.push(planDiscount.reason);
  }

  const bulkDiscount = applyBulkDiscount(
    input.subtotalCents,
    input.itemCount,
  );
  if (bulkDiscount.reason) {
    discountCents += bulkDiscount.discountCents;
    discountReasons.push(bulkDiscount.reason);
  }

  const loyaltyDiscount = applyLoyaltyDiscount(
    input.subtotalCents - discountCents,
    input.user.loyaltyPoints,
  );
  if (loyaltyDiscount.reason) {
    discountCents += loyaltyDiscount.discountCents;
    discountReasons.push(loyaltyDiscount.reason);
  }

  const subtotalAfterDiscount = input.subtotalCents - discountCents;
  const taxCents = calculateTax(subtotalAfterDiscount);
  const totalCents = subtotalAfterDiscount + taxCents;

  return {
    subtotalCents: input.subtotalCents,
    discountCents,
    taxCents,
    totalCents,
    discountReasons,
  };
}
