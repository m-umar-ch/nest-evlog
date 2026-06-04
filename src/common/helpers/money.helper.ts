export function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function sumCents(amounts: number[]): number {
  return amounts.reduce((total, amount) => total + amount, 0);
}

export function formatCurrency(cents: number): string {
  return `$${centsToDollars(cents).toFixed(2)}`;
}
