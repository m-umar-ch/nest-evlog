import { createError } from 'evlog';

export function assertNonEmpty(value: string, field: string): void {
  if (!value?.trim()) {
    throw createError({
      message: `${field} is required`,
      status: 400,
      why: `The ${field} field was empty or missing`,
      fix: `Provide a valid ${field}`,
    });
  }
}

export function assertPositive(value: number, field: string): void {
  if (value <= 0) {
    throw createError({
      message: `${field} must be positive`,
      status: 400,
      why: `Received ${field}=${value}`,
      fix: `Provide a positive value for ${field}`,
    });
  }
}
