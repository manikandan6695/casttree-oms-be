import { EsubscriptionStatus } from "./../process/enums/process.enum";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { SubscriptionProvider } from "./subscription.interface";
import { HelperService } from "src/helper/helper.service";
import { SharedService } from "src/shared/shared.service";
import { SubscriptionService } from "./subscription.service";
import { InvoiceService } from "src/invoice/invoice.service";
import { PaymentRequestService } from "src/payment/payment-request.service";
import { MandatesService } from "../mandates/mandates.service";
import { EStatus } from "src/shared/enum/privacy.enum";
import { EDocumentStatus } from "src/invoice/enum/document-status.enum";
import { MandateHistoryService } from "src/mandates/mandate-history/mandate-history.service";

@Injectable()
export class SubscriptionFactory {
  constructor(
    private readonly helperService: HelperService,
    private readonly sharedService: SharedService,
    private readonly mandateService: MandatesService,
    private readonly mandateHistoryService: MandateHistoryService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    private readonly invoiceService: InvoiceService,
    private readonly paymentService: PaymentRequestService
  ) {}

  getProvider(providerName: string): SubscriptionProvider {
    const providers: Record<string, SubscriptionProvider> = {
      razorpay: {
        createSubscription: async (data: any, token: UserToken) =>
          this.helperService.addSubscription(data, token),
      },
      cashfree: {
        createSubscription: async (data: any, bodyData, token: UserToken) =>
          this.handleCashfreeSubscription(data, bodyData, token),
      },
    };

    if (!providers[providerName]) {
      throw new Error(`Invalid subscription provider: ${providerName}`);
    }

    return providers[providerName];
  }

  private async handleCashfreeSubscription(
    data: any,
    bodyData,
    token: UserToken
  ) {
    console.log("inside handle cashfree", data);
    console.log("bodyData", bodyData);

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

    const authData = {
      subscription_id: subscription?.subscription_id,
      payment_id: paymentNumber,
      payment_amount: subscription?.authorization_details?.authorization_amount,
      payment_schedule_date: new Date().toISOString(),
      payment_type: "AUTH",
      payment_method: { upi: { channel: "link" } },
    };
    const auth = await this.helperService.createAuth(authData);

    const subscriptionData = {
      userId: token.id,
      planId: subscription.plan_details.plan_id,
      startAt: new Date().toISOString(),
      endAt: data.subscription_expiry_time,
      amount: data.authorization_details.authorization_amount,
      notes: { itemId: bodyData.itemId },
      subscriptionStatus: EsubscriptionStatus.pending,
      metaData: subscription,
    };
    const subscriptionCreated = await this.subscriptionService.subscription(
      subscriptionData,
      token
    );

    const mandateData = {
      sourceId: subscriptionCreated._id,
      userId: token.id,
      paymentMethod: "UPI",
      amount: bodyData.authAmount,
      currency: "INR",
      planId: subscription.plan_details.plan_id,
      frequency: subscription.plan_details.plan_type,
      mandateStatus: EsubscriptionStatus.pending,
      status: EStatus.Active,
      metaData: auth,
      startDate: data.subscription_first_charge_time,
      endDate:
        bodyData.validityType == "day"
          ? this.sharedService.getFutureDateISO(bodyData.validity)
          : this.sharedService.getFutureMonthISO(bodyData.validity),
    };
    let mandate = await this.mandateService.addMandate(mandateData, token);

    await this.mandateHistoryService.createMandateHistory({
      mandateId: mandate._id,
      mandateStatus: EsubscriptionStatus.pending,
      status: EStatus.Active,
      createdBy: token.id,
      updatedBy: token.id,
    });

    const invoiceData = {
      itemId: bodyData.itemId,
      source_id: subscriptionCreated._id,
      source_type: "subscription",
      sub_total: bodyData.authAmount,
      currencyCode: "INR",
      document_status: EDocumentStatus.pending,
      grand_total: bodyData.authAmount,
    };
    const invoice = await this.invoiceService.createInvoice(invoiceData);

    const paymentData = {
      amount: bodyData.authAmount,
      currencyCode: "INR",
      document_status: EDocumentStatus.pending,
    };
    await this.paymentService.createPaymentRecord(
      paymentData,
      token,
      invoice,
      "INR",
      null
    );

    return {
      subscriptionDetails: subscription,
      authorizationDetails: auth,
    };
  }
}
