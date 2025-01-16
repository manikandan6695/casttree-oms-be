import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { MongooseModule } from "@nestjs/mongoose";
import { SharedModule } from 'src/shared/shared.module';
import { AuthModule } from 'src/auth/auth.module';
import { subscriptionSchema } from './schema/subscription.schema';
import { HelperModule } from 'src/helper/helper.module';
import { InvoiceModule } from 'src/invoice/invoice.module';
import { PaymentRequestModule } from 'src/payment/payment-request.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "subscription", schema: subscriptionSchema },
    ]),
    SharedModule,
    AuthModule,
    HelperModule,
    InvoiceModule,
    PaymentRequestModule
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService]
})
export class SubscriptionModule {}
