import { EStatus } from "src/shared/enum/privacy.enum";
import { MandatesService } from "./../mandates/mandates.service";
import { Injectable } from "@nestjs/common";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { SubscriptionProvider } from "./subscription.interface";
import { HelperService } from "src/helper/helper.service";
import { SharedService } from "src/shared/shared.service";
import { SubscriptionService } from "./subscription.service";
import { InvoiceService } from "src/invoice/invoice.service";
import { EDocumentStatus } from "src/invoice/enum/document-status.enum";
import { PaymentRequestService } from "src/payment/payment-request.service";

@Injectable()
export class SubscriptionFactory {
  constructor(
    private readonly helperService: HelperService,
    private readonly sharedService: SharedService,
    private readonly mandateService: MandatesService,
    // private readonly subscriptionService: SubscriptionService,
    private readonly invoiceService: InvoiceService,
    private readonly paymentService: PaymentRequestService
  ) {}

  getProvider(providerName: string): SubscriptionProvider {
    switch (providerName) {
      case "razorpay":
        return {
          createSubscription: async (data: any, token: UserToken) => {
            // Razorpay API Integration
            const response = await this.helperService.addSubscription(
              data,
              token
            );
            return response;
          },
        };
      case "cashfree":
        return {
          createSubscription: async (data: any, token: UserToken) => {
            // Cashfree API Integration
            const subscription = await this.helperService.createSubscription(
              data,
              token
            );
            const paymentSequence = await this.sharedService.getNextNumber(
              "cashfree-payment",
              "CSH-PMT",
              5,
              null
            );
            const paymentNumber = paymentSequence.toString().padStart(5, "0");
            let authData = {
              subscription_id: subscription?.subscription_id,
              payment_id: paymentNumber,
              payment_amount:
                subscription?.authorization_details?.authorization_amount,
              payment_schedule_date: new Date().toISOString(),
              payment_type: "AUTH",
              payment_method: {
                upi: {
                  channel: "link",
                },
              },
            };
            const auth = await this.helperService.createAuth(authData);
            let subscriptionData = {
              userId: token.id,
              planId: subscription.plan_details.plan_id,
              startAt: data.startAt,
              endAt: data.endAt,
              amount: data.amount,
              notes: data.notes,
              subscriptionStatus: data.subscriptionStatus,
              metaData: subscription,
            };
            // let subscriptionCreated =
            //   await this.subscriptionService.subscription(
            //     subscriptionData,
            //     token
            //   );
            // let mandateData = {
            //   sourceId: subscriptionCreated._id,
            //   userId: token.id,
            //   paymentMethod: "UPI",
            //   amount: data.amount,
            //   currency: "INR",
            //   frequency: subscription.plan_details.plan_type,
            //   mandateStatus: data.mandateStatus,
            //   status: EStatus.Active,
            //   metaData: auth,
            //   startDate: data.startDate,
            //   endDate: data.endDate,
            // };
            // let createdMandate = await this.mandateService.addMandate(
            //   mandateData,
            //   token
            // );
            // let invoiceData = {
            //   itemId: data.itemId,
            //   source_id: data?.sourceId,
            //   source_type: data?.sourceType,
            //   sub_total: data?.amount,
            //   currencyCode: data.currencyCode,
            //   document_status: EDocumentStatus.pending,
            //   grand_total: data?.amount,
            // };
            // let invoice = await this.invoiceService.createInvoice(invoiceData);
            // let paymentData: any = {
            //   amount: data?.amount,
            //   currencyCode: "INR",
            //   document_status: EDocumentStatus.pending,
            // };
            // let payment = await this.paymentService.createPaymentRecord(
            //   paymentData,
            //   null,
            //   invoice,
            //   null,
            //   null
            // );
            let response = {
              subscriptionDetails: subscription,
              authorizationDetails: auth,
            };
            return response;
          },
        };
      default:
        throw new Error(`Invalid subscription provider: ${providerName}`);
    }
  }
}
