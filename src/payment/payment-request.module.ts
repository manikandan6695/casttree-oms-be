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
import { SalesChanelSchema } from "src/item/schema/item.schema";
import { CoinTransactionSchema } from "./schema/coinPurchase.schema";
import { RedisModule } from "src/redis/redis.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: "payment", schema: PaymentSchema },{ name: "salesDocument", schema: SalesChanelSchema },{ name: "coinTransaction", schema: CoinTransactionSchema }]),
    SharedModule,
    AuthModule,
    InvoiceModule,
    HelperModule,
    forwardRef(() =>  ServiceRequestModule),
    HttpModule,
    forwardRef(() =>ItemModule),
    RedisModule,
  ],
  providers: [PaymentRequestService, PaymentService],
  controllers: [PaymentRequestController],
  exports: [PaymentRequestService],
})
export class PaymentRequestModule {}
