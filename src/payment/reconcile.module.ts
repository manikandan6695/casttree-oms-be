import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReconcileWorker } from './reconcile.processor';
import { ReconcileQueueService } from './reconcile.queue.service';
import { HelperModule } from 'src/helper/helper.module';
import { redisConnection } from 'src/config/redis';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'reconcile',
      connection: redisConnection,
     
    }),
    HelperModule,
  ],
  providers: [ReconcileQueueService, ReconcileWorker],
  exports: [ReconcileQueueService, ReconcileWorker],
})
export class ReconcileModule {}
