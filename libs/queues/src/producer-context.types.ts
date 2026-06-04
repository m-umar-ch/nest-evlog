/**
 * Snapshot of a producer app's in-flight wide event, stored on the BullMQ job
 * so the worker can emit a correlated job event with full upstream context.
 */
export interface ProducerWideEventContext {
  /** Producer requestId (API checkout, clock trigger, etc.) */
  requestId?: string;
  service: string;
  method?: string;
  path?: string;
  /** Accumulated wide-event fields at enqueue time (user, checkout, order, …). */
  context: Record<string, unknown>;
  capturedAt: string;
}

export interface WideEventCaptureSource {
  getContext(): Record<string, unknown>;
}
