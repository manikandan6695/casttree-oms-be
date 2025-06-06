import { forwardRef, Injectable, Module, OnModuleInit,Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HelperService } from '../helper/helper.service';
import{ ISettlementModel } from './schema/settlement.schema';
import { PaymentRequestService } from "../payment/payment-request.service";
import { PaymentRequestModule } from 'src/payment/payment-request.module';


@Injectable()
export class SettlementService implements OnModuleInit {
  constructor(
    private readonly helperService: HelperService,
    @InjectModel('Settlement')
    private readonly settlementModel: Model<ISettlementModel>,
    @Inject(forwardRef(() => PaymentRequestService))
    private PaymentRequestService: PaymentRequestService,
    @InjectModel('Payment')
    private readonly paymentModel: Model<PaymentRequest>,


  ) {}

  async fetchRecentSettlements(): Promise<any[]> {
    const settlements: any[] = [];

    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      console.log(`Fetching settlement for: ${year}-${month}-${day}`);

      const dailySettlements = await this.helperService.getCombinedSettlementRecon(year, month, day);

      for (const item of dailySettlements) {

   
        const payment = await this.PaymentRequestService
          .findOne({ payment_order_id: item.order_id })
          .populate('paymentid') 
          .lean();

  //    async getpayment(payment: string): {
  //   try {
  //     let data = await this.PaymentRequestService.findOne(
  //       { itemIdpayment_order_id: payment },
  //       PaymentSchema,
  //       { lean: true }
  //     );
  //     return data;
  //   } catch (err) {
  //     throw err;
  //   }
  // }

  
  //     let payment = null;
  // const orderIdsToTry = [item.order_id];

  // for (const orderId of orderIdsToTry) {
  //   if (!orderId) continue;

  //   const found = await this.PaymentRequestService.getPaymentDataBtOrderId(orderId);
  //   if (found && !payment) {
  //     payment = found;
  //     console.log(`Found payment for order ID ${orderId}:`, payment);
  //   }
  // }
  const payload: Partial<ISettlementModel> = {
  settlementId: item.settlement_id,
  providerId: item.entity_id,
  provider: 'razorpay',
  status: item.settled ,
  settlementStatus: item.settled ,
  paymentId:payment?._id, 
  amount: item.amount,
  fee: item.fee,
  taxAmount: item.tax,
  currency: item.currency,
  settlementDate: new Date(item.settled_at * 1000),
  referenceId: item.order_id || null,
  paymentReferenceNumber: item.settlement_utr,
  metadata: {
    transaction: item,
  },
};

        // Save to MongoDB
        const saved = await this.settlementModel.create(payload);
  console.log('Saved settlement:', saved._id);
  settlements.push(saved);
      }
    }

    console.log('Saved settlements count:', settlements.length);
    return settlements;
  }

  async onModuleInit() {
    await this.fetchRecentSettlements();
  }
}
