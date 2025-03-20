import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "src/auth/auth.module";
import { HelperModule } from "src/helper/helper.module";
import { InvoiceModule } from "src/invoice/invoice.module";
import { ItemModule } from "src/item/item.module";
import { PaymentRequestModule } from "src/payment/payment-request.module";
import { SharedModule } from "src/shared/shared.module";
import { subscriptionSchema } from "./schema/subscription.schema";
import { Mandate, MandateSchema } from "../mandates/schema/mandates.schema";
import { SubscriptionController } from "./subscription.controller";
import { SubscriptionService } from "./subscription.service";
import { SubscriptionFactory } from "./subscription.factory";
import { MandatesModule } from "src/mandates/mandates.module";
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "subscription", schema: subscriptionSchema },
      { name: Mandate.name, schema: MandateSchema }
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
  providers: [SubscriptionService, SubscriptionFactory],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
