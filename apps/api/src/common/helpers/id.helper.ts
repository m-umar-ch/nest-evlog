export function generateId(prefix: string): string {
  const suffix = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${suffix}`;
}

export function isValidUserId(id: string): boolean {
  return /^usr_[a-z0-9]+$/.test(id);
}
