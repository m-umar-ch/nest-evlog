import { createLogger } from 'evlog';

/** Loose logger for background jobs — evlog allows arbitrary wide-event fields at runtime. */
export interface JobLogger {
  set: (data: Record<string, unknown>) => void;
  error: (error: Error | string, errorContext?: Record<string, unknown>) => void;
  info: (message: string, infoContext?: Record<string, unknown>) => void;
  warn: (message: string, warnContext?: Record<string, unknown>) => void;
  emit: (overrides?: Record<string, unknown>) => unknown;
}

function wrapLogger(raw: ReturnType<typeof createLogger>): JobLogger {
  return {
    set: (data) => raw.set(data as never),
    error: (error, ctx) => raw.error(error, ctx as never),
    info: (message, ctx) => raw.info(message, ctx as never),
    warn: (message, ctx) => raw.warn(message, ctx as never),
    emit: (overrides) => raw.emit(overrides as never),
  };
}

/**
 * Emit one wide event per cron tick or BullMQ job (no HTTP request scope).
 * Use in clock (producer) and worker (consumer) apps.
 */
export async function runWithJobLogger<T>(
  context: Record<string, unknown>,
  fn: (log: JobLogger) => Promise<T>,
): Promise<T> {
  const log = wrapLogger(createLogger(context));

  try {
    const result = await fn(log);
    log.set({ outcome: 'success' });
    log.emit();
    return result;
  } catch (error) {
    log.error(error instanceof Error ? error : new Error(String(error)));
    log.set({ outcome: 'failure' });
    log.emit();
    throw error;
  }
}

export function setJobStep(
  log: JobLogger,
  step: string,
  data?: Record<string, unknown>,
) {
  log.set({
    steps: { [step]: { at: new Date().toISOString(), ...data } },
  });
}
