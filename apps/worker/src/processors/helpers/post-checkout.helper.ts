import {
  assertWorkerShouldSucceed,
  type PostCheckoutJobPayload,
} from '@nest-evlog/queues';
import type { JobLogger } from '@nest-evlog/job-logging';
import { setJobStep } from '@nest-evlog/job-logging';

export async function fulfillPostCheckout(
  payload: PostCheckoutJobPayload,
  log: JobLogger,
): Promise<{ fulfilled: boolean; orderId: string }> {
  setJobStep(log, 'validate_order', {
    orderId: payload.orderId,
    userId: payload.userId,
  });
  await delay(40);

  setJobStep(log, 'sync_fulfillment_systems', {
    transactionId: payload.transactionId,
    totalCents: payload.totalCents,
  });
  await delay(50);

  assertWorkerShouldSucceed(payload, {
    step: 'sync_fulfillment_systems',
    queue: 'post-checkout',
  });

  setJobStep(log, 'mark_order_fulfilled');
  await delay(30);

  log.set({
    fulfillment: {
      orderId: payload.orderId,
      totalCents: payload.totalCents,
    },
  });

  return { fulfilled: true, orderId: payload.orderId };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
