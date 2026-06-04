export type EvlogErrorOptions = {
  message: string;
  status?: number;
  why?: string;
  fix?: string;
  link?: string;
};

export type EvlogError = Error & EvlogErrorOptions;

export function initLogger(): void {}

export function parseError(error: EvlogError) {
  return {
    message: error.message,
    status: error.status ?? 500,
    why: error.why,
    fix: error.fix,
    link: error.link,
  };
}

export function createError(input: string | EvlogErrorOptions): EvlogError {
  const opts = typeof input === 'string' ? { message: input } : input;
  const err = new Error(opts.message) as EvlogError;
  err.status = opts.status ?? 500;
  err.why = opts.why;
  err.fix = opts.fix;
  err.link = opts.link;
  return err;
}
