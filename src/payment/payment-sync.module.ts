import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PaymentSyncService } from "./payment-sync.service";
import { PaymentSyncEntity } from "./payment-sync.entity";
import { PaymentSchema } from "./schema/payment.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "payment", schema: PaymentSchema }
    ]),
    TypeOrmModule.forFeature([PaymentSyncEntity])
  ],
  controllers: [],
  providers: [PaymentSyncService],
  exports: [PaymentSyncService]
})
export class PaymentSyncModule {}
