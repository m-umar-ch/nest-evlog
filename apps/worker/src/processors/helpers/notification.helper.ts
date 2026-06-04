import {
  assertWorkerShouldSucceed,
  type NotificationDispatchJobPayload,
} from '@nest-evlog/queues';
import type { JobLogger } from '@nest-evlog/job-logging';
import { setJobStep } from '@nest-evlog/job-logging';

export async function dispatchNotification(
  payload: NotificationDispatchJobPayload,
  log: JobLogger,
): Promise<{ delivered: boolean; channel: string }> {
  setJobStep(log, 'render_template', { template: payload.template });
  await delay(35);

  assertWorkerShouldSucceed(payload, {
    step: 'render_template',
    queue: 'notification-dispatch',
  });

  setJobStep(log, 'send_message', {
    userId: payload.userId,
    channel: payload.channel,
  });
  await delay(45);

  log.set({
    notification: {
      userId: payload.userId,
      channel: payload.channel,
      template: payload.template,
    },
  });

  return { delivered: true, channel: payload.channel };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
