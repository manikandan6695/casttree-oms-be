import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "src/auth/auth.module";
import { HelperModule } from "src/helper/helper.module";
import { InvoiceModule } from "src/invoice/invoice.module";
import { PaymentService } from "src/service-provider/payment.service";
import { ServiceRequestModule } from "src/service-request/service-request.module";
import { SharedModule } from "src/shared/shared.module";
import { PaymentRequestController } from "./payment-request.controller";
import { PaymentRequestService } from "./payment-request.service";
import { PaymentSchema } from "./schema/payment.schema";

import { HttpModule } from "@nestjs/axios";
import { ItemModule } from "src/item/item.module";
import { SubscriptionModule } from "src/subscription/subscription.module";
import { MandatesModule } from "src/mandates/mandates.module";
import { ReconcileModule } from "./reconcile.module";
import { ReconcileWorker } from "./reconcile.processor";
import { BullModule } from '@nestjs/bullmq';
import { ReconcileQueueService } from "./reconcile.queue.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "payment", schema: PaymentSchema }]),
    SharedModule,
    AuthModule,
    InvoiceModule,
    HelperModule,
    forwardRef(() => ServiceRequestModule),
    HttpModule,
    forwardRef(() => ItemModule),
    forwardRef(() => SubscriptionModule),
    MandatesModule,
    forwardRef(() => ReconcileModule),
    BullModule.registerQueue({
      name: 'reconcile',
      connection: {
        host: 'redis-prod.casttree.com',
        port: 6379,
        password: 'creedom_redis_prod',
        connectTimeout: 6000
      }  
    })
  ],
  providers: [PaymentRequestService, PaymentService, ReconcileQueueService, ReconcileWorker],
  controllers: [PaymentRequestController],
  exports: [PaymentRequestService, ReconcileQueueService],
})
export class PaymentRequestModule { }
