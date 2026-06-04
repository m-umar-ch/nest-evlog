import type { OrderSyncJobPayload } from '@nest-evlog/queues';
import type { JobLogger } from '@nest-evlog/job-logging';
import { setJobStep } from '@nest-evlog/job-logging';

export async function simulateOrderSync(
  payload: OrderSyncJobPayload,
  log: JobLogger,
): Promise<{ syncedOrders: number; userId: string }> {
  setJobStep(log, 'fetch_remote_orders', { userId: payload.userId });
  await delay(50);

  setJobStep(log, 'merge_local_state', { orderId: payload.orderId ?? 'none' });
  await delay(30);

  setJobStep(log, 'persist_snapshot');
  await delay(20);

  return { syncedOrders: 3, userId: payload.userId };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
