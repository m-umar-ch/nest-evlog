import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { EvlogModule } from 'evlog/nestjs';
import { ALL_QUEUES, getRedisConnection } from '@nest-evlog/queues';
import { CronJobsService } from './cron/cron-jobs.service';
import { EnqueueService } from './enqueue/enqueue.service';
import { HealthController } from './health.controller';
import { TriggerController } from './trigger/trigger.controller';

@Module({
  imports: [
    EvlogModule.forRoot({
      exclude: ['/health'],
    }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: getRedisConnection(),
    }),
    BullModule.registerQueue(...ALL_QUEUES.map((name) => ({ name }))),
  ],
  controllers: [HealthController, TriggerController],
  providers: [EnqueueService, CronJobsService],
})
export class AppModule {}
