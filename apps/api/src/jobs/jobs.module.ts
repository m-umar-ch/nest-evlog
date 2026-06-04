import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { getRedisConnection, QUEUES } from '@nest-evlog/queues';
import { CheckoutJobsService } from './checkout-jobs.service';

@Module({
  imports: [
    BullModule.forRoot({
      connection: getRedisConnection(),
    }),
    BullModule.registerQueue({ name: QUEUES.POST_CHECKOUT }),
  ],
  providers: [CheckoutJobsService],
  exports: [CheckoutJobsService],
})
export class JobsModule {}
