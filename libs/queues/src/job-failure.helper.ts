import { createError } from 'evlog';
import {
  DEMO_FAIL_SKU,
  DEMO_FAIL_USER_ENQUEUE,
  DEMO_FAIL_USER_WORKER,
  type JobFailureMode,
} from './failure.constants';

export interface JobFailureContext {
  failureMode?: JobFailureMode;
  userId?: string;
  sku?: string;
}

export function resolveFailureMode(
  context: JobFailureContext,
  phase: JobFailureMode,
): boolean {
  if (context.failureMode === phase) {
    return true;
  }
  if (phase === 'enqueue' && context.userId === DEMO_FAIL_USER_ENQUEUE) {
    return true;
  }
  if (phase === 'worker') {
    if (context.userId === DEMO_FAIL_USER_WORKER) {
      return true;
    }
    if (context.sku === DEMO_FAIL_SKU) {
      return true;
    }
  }
  return false;
}

/** Throws before a job is added to Redis — clock wide event logs outcome: failure. */
export function assertEnqueueShouldSucceed(context: JobFailureContext): void {
  if (!resolveFailureMode(context, 'enqueue')) {
    return;
  }

  throw createError({
    message: 'Enqueue rejected by policy',
    status: 422,
    why: `User "${context.userId ?? 'unknown'}" or payload is flagged for enqueue failure demo`,
    fix: 'Use a normal userId or omit fail: "enqueue" in the trigger body',
  });
}

/** Throws mid-job — worker wide event includes steps + error before outcome: failure. */
export function assertWorkerShouldSucceed(
  context: JobFailureContext,
  details?: { step?: string; queue?: string },
): void {
  if (!resolveFailureMode(context, 'worker')) {
    return;
  }

  throw createError({
    message: 'Job processing failed (simulated)',
    status: 500,
    why: details?.step
      ? `Simulated failure after step "${details.step}" on queue ${details.queue ?? 'unknown'}`
      : 'Payload flagged for worker failure demo',
    fix: 'Omit fail: "worker", or use userId/sku without fail_* demo values',
  });
}
