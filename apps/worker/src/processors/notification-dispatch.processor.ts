import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { runWithJobLogger } from '@nest-evlog/job-logging';
import {
  buildJobLoggerInitialContext,
  QUEUES,
  type NotificationDispatchJobPayload,
} from '@nest-evlog/queues';
import { dispatchNotification } from './helpers/notification.helper';

@Processor(QUEUES.NOTIFICATION_DISPATCH)
export class NotificationDispatchProcessor extends WorkerHost {
  async process(job: Job<NotificationDispatchJobPayload>) {
    return runWithJobLogger(
      buildJobLoggerInitialContext(
        {
          app: 'worker',
          operation: 'job.notification_dispatch',
          correlationId: job.data.correlationId,
          jobId: job.id,
          queue: QUEUES.NOTIFICATION_DISPATCH,
          attempt: job.attemptsMade + 1,
        },
        job.data.producer,
      ),
      async (log) => {
        log.set({
          job: {
            name: job.name,
            source: job.data.source,
            userId: job.data.userId,
            template: job.data.template,
            failureMode: job.data.failureMode ?? 'none',
          },
        });

        const result = await dispatchNotification(job.data, log);
        log.set({ result });
        return result;
      },
    );
  }
}
