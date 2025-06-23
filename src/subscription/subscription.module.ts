import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "src/auth/auth.module";
import { HelperModule } from "src/helper/helper.module";
import { InvoiceModule } from "src/invoice/invoice.module";
import { ItemModule } from "src/item/item.module";
import { PaymentRequestModule } from "src/payment/payment-request.module";
import { SharedModule } from "src/shared/shared.module";
import { MandatesModule } from "src/mandates/mandates.module"; // ✅ Import MandatesModule
import { subscriptionSchema } from "./schema/subscription.schema";
import { SubscriptionController } from "./subscription.controller";
import { SubscriptionService } from "./subscription.service";

import { SubscriptionFactory } from "./subscription.factory";
import { webhookSchema } from "./schema/webhook.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "subscription", schema: subscriptionSchema },
      { name: "webhook", schema: webhookSchema },
    ]),
    SharedModule,
    AuthModule,
    HelperModule,
    InvoiceModule,
    PaymentRequestModule,
    forwardRef(() => ItemModule),
    MandatesModule,
  ],
  controllers: [SubscriptionController],
  providers: [
    {
      provide: SubscriptionService,
      useClass: SubscriptionService,
    },
    SubscriptionFactory,
  ],
  exports: [SubscriptionService, SubscriptionFactory],
})
export class SubscriptionModule {}
