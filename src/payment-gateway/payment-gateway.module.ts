import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PaymentGatewayController } from "./payment-gateway.controller";
import { PaymentGatewayService } from "./payment-gateway.service";
import { PaymentGatewayConfigurationSchema } from "./schema/payment-gateway-configuration.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: "paymentGatewayConfiguration",
        schema: PaymentGatewayConfigurationSchema,
      },
    ]),
  ],
  controllers: [PaymentGatewayController],
  providers: [PaymentGatewayService],
  exports: [PaymentGatewayService],
})
export class PaymentGatewayModule {}

