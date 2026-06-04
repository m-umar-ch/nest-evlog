export function generateCorrelationId(): string {
  const suffix = Math.random().toString(36).slice(2, 10);
  return `corr_${suffix}`;
}
