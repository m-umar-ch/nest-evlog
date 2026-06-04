import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { runWithJobLogger } from '@nest-evlog/job-logging';
import { QUEUES, type OrderSyncJobPayload } from '@nest-evlog/queues';
import { simulateOrderSync } from './helpers/sync.helper';

@Processor(QUEUES.ORDER_SYNC)
export class OrderSyncProcessor extends WorkerHost {
  async process(job: Job<OrderSyncJobPayload>) {
    return runWithJobLogger(
      {
        app: 'worker',
        operation: 'job.order_sync',
        correlationId: job.data.correlationId,
        jobId: job.id,
        queue: QUEUES.ORDER_SYNC,
        attempt: job.attemptsMade + 1,
      },
      async (log) => {
        log.set({
          job: {
            name: job.name,
            source: job.data.source,
            userId: job.data.userId,
            failureMode: job.data.failureMode ?? 'none',
          },
        });

        const result = await simulateOrderSync(job.data, log);
        log.set({ result });
        return result;
      },
    );
  }
}
