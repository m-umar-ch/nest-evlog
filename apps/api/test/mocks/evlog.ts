export function initLogger(): void {}

export function parseError(error: Error) {
  return {
    message: error.message,
    status: 500,
    why: undefined,
    fix: undefined,
    link: undefined,
  };
}

export function createError(message: string): Error {
  return new Error(message);
}
