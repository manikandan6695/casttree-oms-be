import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "src/auth/auth.module";
import { HelperModule } from "src/helper/helper.module";
import { InvoiceModule } from "src/invoice/invoice.module";
import { PaymentService } from "src/service-provider/payment.service";
import { SharedModule } from "src/shared/shared.module";
import { PaymentRequestController } from "./payment-request.controller";
import { PaymentRequestService } from "./payment-request.service";
import { PaymentSchema } from "./schema/payment.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "payment", schema: PaymentSchema }]),
    SharedModule,
    AuthModule,
    InvoiceModule,
    HelperModule,
  ],
  providers: [PaymentRequestService, PaymentService],
  controllers: [PaymentRequestController],
  exports: [PaymentRequestService],
})
export class PaymentRequestModule {}
