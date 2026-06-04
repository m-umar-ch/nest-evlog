import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { runWithJobLogger } from '@nest-evlog/job-logging';
import { QUEUES, type InventoryAlertJobPayload } from '@nest-evlog/queues';
import { processInventoryAlert } from './helpers/inventory.helper';

@Processor(QUEUES.INVENTORY_ALERT)
export class InventoryAlertProcessor extends WorkerHost {
  async process(job: Job<InventoryAlertJobPayload>) {
    return runWithJobLogger(
      {
        app: 'worker',
        operation: 'job.inventory_alert',
        correlationId: job.data.correlationId,
        jobId: job.id,
        queue: QUEUES.INVENTORY_ALERT,
        attempt: job.attemptsMade + 1,
      },
      async (log) => {
        log.set({
          job: {
            name: job.name,
            source: job.data.source,
            sku: job.data.sku,
          },
        });

        const result = await processInventoryAlert(job.data, log);
        log.set({ result });
        return result;
      },
    );
  }
}
