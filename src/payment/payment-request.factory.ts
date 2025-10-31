import { Injectable } from "@nestjs/common";
import { PaymentService } from "src/service-provider/payment.service";
import { PaymentRequestProvider } from "./payment-request.interface";

@Injectable()
export class PaymentRequestFactory {
  constructor(
    private readonly paymentService: PaymentService
  ) {}

  getPaymentProvider(providerName: string): PaymentRequestProvider {
    const providers: Record<string, PaymentRequestProvider> = {
      razorpay: {
        createPayment: async (data, requestId, accessToken, metaData) => {
         return await this.paymentService.createPGOrder(data.userId.toString(), data.currencyCode, data.currency, data.amount, requestId, accessToken, metaData);
        },
      }
    };

    return providers[providerName];
  }
}
