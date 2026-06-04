import type {
  ProducerWideEventContext,
  WideEventCaptureSource,
} from './producer-context.types';

/**
 * Merge producer snapshot into worker/cron job logger context.
 * Sets _parentRequestId for evlog correlation (same field as log.fork children).
 */
export function buildJobLoggerInitialContext(
  base: Record<string, unknown>,
  producer?: ProducerWideEventContext,
): Record<string, unknown> {
  if (!producer) {
    return base;
  }

  return {
    ...base,
    _parentRequestId: producer.requestId,
    producer: {
      service: producer.service,
      method: producer.method,
      path: producer.path,
      capturedAt: producer.capturedAt,
    },
    parentEvent: producer.context,
  };
}

const TRANSPORT_OMIT_KEYS = new Set(['requestLogs']);

export function sanitizeContextForTransport(
  context: Record<string, unknown>,
): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (!TRANSPORT_OMIT_KEYS.has(key)) {
      snapshot[key] = value;
    }
  }
  return snapshot;
}

/** Call from the producer (API, clock HTTP) before the HTTP wide event is emitted. */
export function captureProducerWideEvent(
  log: WideEventCaptureSource,
  meta: { service: string; method?: string; path?: string },
): ProducerWideEventContext {
  const raw = log.getContext() as Record<string, unknown>;
  const requestId =
    typeof raw.requestId === 'string' ? raw.requestId : undefined;

  return {
    requestId,
    service: meta.service,
    method: meta.method,
    path: meta.path,
    context: sanitizeContextForTransport(raw),
    capturedAt: new Date().toISOString(),
  };
}
