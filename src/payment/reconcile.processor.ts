import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { HelperService } from 'src/helper/helper.service';
import { EProvider } from 'src/subscription/enums/provider.enum';

@Processor('reconcile')
@Injectable()
export class ReconcileWorker extends WorkerHost implements OnModuleDestroy {
  constructor(private readonly helperService: HelperService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'fetchCashfreePayment') {
      const { subscription_id, payment_id, provider } = job.data;

      if (provider !== EProvider.cashfree) {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      try {
        const result = await this.helperService.getCashfreePaymentByOrderId(
          subscription_id,
          payment_id
        );

        return Array.isArray(result) ? result : [result];
      } catch (error) {
        console.error(`Error processing Cashfree payment:`, error);
        throw error;
      }
    }

    throw new Error(`Unhandled job type: ${job.name}`);
  }

  async onModuleDestroy() {
    console.log('ReconcileWorker shutdown complete');
  }
}
