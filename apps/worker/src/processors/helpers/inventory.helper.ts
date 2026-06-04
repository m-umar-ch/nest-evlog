import type { InventoryAlertJobPayload } from '@nest-evlog/queues';
import type { JobLogger } from '@nest-evlog/job-logging';
import { setJobStep } from '@nest-evlog/job-logging';

export async function processInventoryAlert(
  payload: InventoryAlertJobPayload,
  log: JobLogger,
): Promise<{ alertSent: boolean; sku: string }> {
  setJobStep(log, 'evaluate_threshold', {
    sku: payload.sku,
    current: payload.currentStock,
    threshold: payload.threshold,
  });

  const belowThreshold = payload.currentStock < payload.threshold;
  log.set({ inventory: { belowThreshold } });

  if (belowThreshold) {
    setJobStep(log, 'notify_ops_team');
    await delay(40);
    return { alertSent: true, sku: payload.sku };
  }

  setJobStep(log, 'skip_alert', { reason: 'stock_ok' });
  return { alertSent: false, sku: payload.sku };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
