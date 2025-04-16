import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { HelperService } from "src/helper/helper.service";
import { EDocumentStatus } from "src/invoice/enum/document-status.enum";
import { InvoiceService } from "src/invoice/invoice.service";
import { EMandateStatus } from "src/mandates/enum/mandate.enum";
import { MandateHistoryService } from "src/mandates/mandate-history/mandate-history.service";
import { EPaymentType } from "src/payment/enum/payment.enum";
import { PaymentRequestService } from "src/payment/payment-request.service";
import { EStatus } from "src/shared/enum/privacy.enum";
import { SharedService } from "src/shared/shared.service";
import { MandatesService } from "../mandates/mandates.service";
import { EsubscriptionStatus } from "./../process/enums/process.enum";
import { EProvider, EProviderId } from "./enums/provider.enum";
import { SubscriptionProvider } from "./subscription.interface";
import { SubscriptionService } from "./subscription.service";

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
      apple: {
        createSubscription: async (data: any, bodyData, token: UserToken) =>
          this.handleAppleIAPSubscription(data, bodyData, token),
      },
      google: {
        createSubscription: async (data: any, bodyData, token: UserToken) =>
          this.hanldeGoogleIAPSubscription(data, bodyData, token),
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
    // console.log("inside handle cashfree", data);
    // console.log("bodyData", bodyData);

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
    let paymentNewNumber = `${paymentNumber}-${Date.now()}`;
    const authData = {
      subscription_id: subscription?.subscription_id,
      payment_id: paymentNewNumber.toString(),
      payment_amount: subscription?.authorization_details?.authorization_amount,
      payment_schedule_date: new Date().toISOString(),
      payment_type: "AUTH",
      payment_method: { upi: { channel: "link" } },
    };
    const auth = await this.helperService.createAuth(authData);
    let endDate = new Date(bodyData?.firstCharge);
    let endAt = endDate.setHours(23, 59, 59, 999);
    const subscriptionData = {
      userId: token.id,
      planId: subscription?.plan_details?.plan_id,
      startAt: new Date().toISOString(),
      endAt: endAt,
      providerId: 2,
      amount: parseInt(data?.authorization_details?.authorization_amount),
      notes: { itemId: bodyData?.itemId },
      subscriptionStatus: EsubscriptionStatus.initiated,
      metaData: subscription,
    };
    // console.log("subscription data", subscriptionData);

    const subscriptionCreated = await this.subscriptionService.subscription(
      subscriptionData,
      token
    );

    const mandateData = {
      sourceId: subscriptionCreated._id,
      userId: token.id,
      paymentMethod: "UPI",
      amount: bodyData?.authAmount,
      providerId: 2,
      currency: "INR",
      planId: subscription?.plan_details?.plan_id,
      frequency: subscription?.plan_details?.plan_type,
      mandateStatus: EMandateStatus.initiated,
      status: EStatus.Active,
      metaData: auth,
      startDate: bodyData.firstCharge,
      endDate: bodyData.expiryTime,

      // startDate: data.subscription_first_charge_time,
      // endDate:
      //   bodyData.validityType == "day"
      //     ? this.sharedService.getFutureDateISO(bodyData.validity)
      //     : this.sharedService.getFutureMonthISO(bodyData.validity),
    };
    // console.log("mandate data", mandateData);
    let mandate = await this.mandateService.addMandate(mandateData, token);

    await this.mandateHistoryService.createMandateHistory({
      mandateId: mandate._id,
      mandateStatus: EMandateStatus.initiated,
      status: EStatus.Active,
      metaData: auth,
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
      user_id: token.id,
      created_by: token.id,
      updated_by: token.id,
    };
    const invoice = await this.invoiceService.createInvoice(invoiceData);

    const paymentData = {
      amount: bodyData.authAmount,
      currencyCode: "INR",
      document_status: EDocumentStatus.pending,
      paymentType: EPaymentType.auth,
      providerId: 2,
      providerName: EProvider.cashfree,
    };
    await this.paymentService.createPaymentRecord(
      paymentData,
      token,
      invoice,
      "INR",
      { order_id: auth.cf_payment_id }
    );
    // console.log("returning data");

    return {
      subscriptionDetails: subscription,
      authorizationDetails: auth,
    };
  }
  private async handleAppleIAPSubscription(data, bodyData, token: UserToken) {
    const transactionId = bodyData.transactionDetails?.externalId;
    // console.log("handleAppleIapSub", data,bodyData)
    const existingSubscription =
      await this.subscriptionService.findExternalId(transactionId);
    if (existingSubscription) {
      // console.log("existing subscription", existingSubscription);

      return existingSubscription;
    }
    let currencyId = await this.helperService.getCurrencyId(bodyData.currencyCode)
    // console.log("currencyId", currencyId);
   let currencyResponse= currencyId?.data?.[0]
    let subscriptionData = {
      userId: token.id,
      planId: data.planId,
      startAt: data.startAt,
      endAt: data.endAt,
      providerId: data.providerId,
      provider: data.provider,
      amount: parseInt(bodyData.authAmount),
      notes: data.notes,
      subscriptionStatus: data.subscriptionStatus,
      createdBy: token?.id,
      updatedBy: token?.id,
      metaData: data.metaData,
      externalId: transactionId,
      currencyCode:currencyResponse.currency_code,
      currencyId:currencyResponse._id,
    };
    // console.log("subscriptionData",subscriptionData);

    const createdSubscription = await this.subscriptionService.subscription(
      subscriptionData,
      token
    );

    const invoiceData = {
      itemId: data?.notes?.itemId,
      source_id: createdSubscription._id,
      source_type: "subscription",
      sub_total: parseInt(bodyData?.authAmount),
      document_status: EDocumentStatus.pending,
      grand_total: parseInt(bodyData?.authAmount),
      user_id: token.id,
      created_by: token.id,
      updated_by: token.id,
      currencyCode:currencyResponse.currency_code,
      currency:currencyResponse._id
    };
    // console.log("invoiceData",invoiceData);
    const invoice = await this.invoiceService.createInvoice(invoiceData);

    const paymentData = {
      amount: bodyData?.authAmount,
      document_status: EDocumentStatus.pending,
      providerId: EProviderId.apple,
      providerName: EProvider.apple,
      transactionDate: new Date(),
      metaData: data.metaData,
      currencyCode:currencyResponse.currency_code,
      currency:currencyResponse._id
    };
    // console.log("paymentData",paymentData);
    await this.paymentService.createPaymentRecord(paymentData, token, invoice);
    const mandateData = {
      sourceId: createdSubscription._id,
      userId: token.id,
      paymentMethod: "UPI",
      amount: bodyData?.authAmount,
      providerId: EProviderId.apple,
      currency: currencyResponse.currency_code,
      planId: data.planId,
      mandateStatus: EMandateStatus.initiated,
      status: EStatus.Active,
      metaData: data.metaData,
      startDate: data.startAt,
      endDate: data.endAt,

    }
    let mandate = await this.mandateService.addMandate(mandateData, token);
    // console.log("mandate",mandate);
    // console.log("mandateData",mandateData);
    await this.mandateHistoryService.createMandateHistory({
      mandateId: mandate._id,
      mandateStatus: EMandateStatus.initiated,
      status: EStatus.Active,
      metaData: data.metaData,
      createdBy: token.id,
      updatedBy: token.id,
    });

    // console.log("mandateHistory",mandateHistory);

    return createdSubscription;
  }

  private async hanldeGoogleIAPSubscription(data, bodyData, token: UserToken) {
    const transactionId = bodyData.transactionDetails?.externalId;
 
    const existingSubscription =
      await this.subscriptionService.findExternalId(transactionId);
    if (existingSubscription) {
      // console.log("existing subscription", existingSubscription);

      return existingSubscription;
    }
    let currencyId = await this.helperService.getCurrencyId(bodyData.currencyCode)
    // console.log("currencyId", currencyId);
    let currencyResponse= currencyId?.data?.[0]
    let subscriptionData = {
      userId: token.id,
      planId: data.planId,
      startAt: data.startAt,
      endAt: data.endAt,
      providerId: data.providerId,
      provider: data.provider,
      amount: parseInt(bodyData.authAmount),
      notes: data.notes,
      subscriptionStatus: data.subscriptionStatus,
      createdBy: token?.id,
      updatedBy: token?.id,
      metaData: data.metaData,
      externalId: transactionId,
      currencyCode:currencyResponse.currency_code,
      currencyId:currencyResponse._id,
    };

    const createdSubscription = await this.subscriptionService.subscription(
      subscriptionData,
      token
    );

    const invoiceData = {
      itemId: data?.notes?.itemId,
      source_id: createdSubscription._id,
      source_type: "subscription",
      sub_total: bodyData?.authAmount,
      document_status: EDocumentStatus.pending,
      grand_total: bodyData?.authAmount,
      user_id: token.id,
      created_by: token.id,
      updated_by: token.id,
      currencyCode:currencyResponse.currency_code,
      currency:currencyResponse._id
    };
    // console.log("invoiceData",invoiceData);

    const invoice = await this.invoiceService.createInvoice(invoiceData);

    const paymentData = {
      amount: bodyData?.authAmount,
      document_status: EDocumentStatus.pending,
      providerId: EProviderId.google,
      providerName: EProvider.google,
      metaData: data.metaData,
      transactionDate: new Date(),
      currencyCode:currencyResponse.currency_code,
      currency:currencyResponse._id
    };
    // console.log("paymentData",paymentData);

    await this.paymentService.createPaymentRecord(paymentData, token, invoice);
    let mandateData = {
      sourceId: createdSubscription._id,
      userId: token.id,
      paymentMethod: "UPI",
      amount: bodyData?.authAmount,
      providerId: EProviderId.google,
      currency: currencyResponse.currency_code,
      planId: data.planId,
      mandateStatus: EMandateStatus.initiated,
      status: EStatus.Active,
      metaData: data.metaData,
      startDate: data.startAt,
      endDate: data.endAt,
    };
    let mandate = await this.mandateService.addMandate(mandateData, token);
    await this.mandateHistoryService.createMandateHistory({
      mandateId: mandate._id,
      mandateStatus: EMandateStatus.initiated,
      status: EStatus.Active,
      metaData: data.metaData,
      createdBy: token.id,
      updatedBy: token.id,
    });
    return createdSubscription;
  }

}
