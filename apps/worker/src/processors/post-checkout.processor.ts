import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { runWithJobLogger } from '@nest-evlog/job-logging';
import {
  buildJobLoggerInitialContext,
  QUEUES,
  type PostCheckoutJobPayload,
} from '@nest-evlog/queues';
import { fulfillPostCheckout } from './helpers/post-checkout.helper';

@Processor(QUEUES.POST_CHECKOUT)
export class PostCheckoutProcessor extends WorkerHost {
  async process(job: Job<PostCheckoutJobPayload>) {
    return runWithJobLogger(
      buildJobLoggerInitialContext(
        {
          app: 'worker',
          operation: 'job.post_checkout',
          correlationId: job.data.correlationId,
          jobId: job.id,
          queue: QUEUES.POST_CHECKOUT,
          attempt: job.attemptsMade + 1,
        },
        job.data.producer,
      ),
      async (log) => {
        log.set({
          job: {
            name: job.name,
            source: job.data.source,
            orderId: job.data.orderId,
            userId: job.data.userId,
          },
        });

        const result = await fulfillPostCheckout(job.data, log);
        log.set({ result });
        return result;
      },
    );
  }
}
