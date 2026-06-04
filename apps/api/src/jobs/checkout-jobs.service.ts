import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  QUEUES,
  generateCorrelationId,
  type PostCheckoutJobPayload,
  type ProducerWideEventContext,
} from '@nest-evlog/queues';

@Injectable()
export class CheckoutJobsService {
  constructor(
    @InjectQueue(QUEUES.POST_CHECKOUT)
    private readonly postCheckoutQueue: Queue<PostCheckoutJobPayload>,
  ) {}

  async enqueuePostCheckout(input: {
    orderId: string;
    userId: string;
    transactionId: string;
    totalCents: number;
    producer: ProducerWideEventContext;
  }) {
    const correlationId = generateCorrelationId();

    const payload: PostCheckoutJobPayload = {
      correlationId,
      source: 'api',
      orderId: input.orderId,
      userId: input.userId,
      transactionId: input.transactionId,
      totalCents: input.totalCents,
      producer: input.producer,
    };

    const job = await this.postCheckoutQueue.add('fulfill', payload, {
      jobId: correlationId,
    });

    return {
      correlationId,
      jobId: job.id,
      queue: QUEUES.POST_CHECKOUT,
    };
  }
}
