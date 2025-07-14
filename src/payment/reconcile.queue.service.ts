import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, QueueEvents } from 'bullmq';
import { EProvider } from 'src/subscription/enums/provider.enum';

@Injectable()
export class ReconcileQueueService implements OnModuleDestroy {
  private static queueEvents: QueueEvents;

  constructor(
    @InjectQueue('reconcile') private readonly queue: Queue
  ) {
    if (!ReconcileQueueService.queueEvents) {
      ReconcileQueueService.queueEvents = new QueueEvents('reconcile', {
        connection: {
          host: 'redis-prod.casttree.com',
          port: 6379,
          password: 'creedom_redis_prod',
          connectTimeout: 6000
        }
        
      });

      ReconcileQueueService.queueEvents.on('error', (err) => {
        console.error('QueueEvents error:', err);
      });
    }
  }

  async enqueue(subscriptionId: string, paymentId: string): Promise<any> {
    try {
      const jobId = `cashfree-${subscriptionId}-${paymentId}`;
      
      const existingJob = await this.queue.getJob(jobId);
      if (existingJob) {
        // console.log(`Job ${jobId} already exists, returning existing result`);
        return await existingJob.waitUntilFinished(ReconcileQueueService.queueEvents);
      }

      const job = await this.queue.add(
        'fetchCashfreePayment',
        { 
          subscription_id: subscriptionId, 
          payment_id: paymentId, 
          provider: EProvider.cashfree 
        },
        {
          jobId,
          removeOnComplete: true,
          removeOnFail: false, 
          attempts: 3, 
          delay: 1000,
          backoff: {
            type: 'exponential',
            delay: 1000 
          }
        }
      );

      return await job.waitUntilFinished(ReconcileQueueService.queueEvents);
    } catch (error) {
      // console.error('Error in enqueue:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await ReconcileQueueService.queueEvents?.close();
  }
}
