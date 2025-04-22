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
import { readFile } from "fs";
import * as path from "path";
import {
  AppStoreServerAPIClient,
  Environment,
  GetTransactionHistoryVersion,
  Order,
  ProductType,
} from "@apple/app-store-server-library";
const issuerId = process.env.ISSUER_ID;
const keyId = process.env.KEY_ID;
const bundleId = process.env.BUNDLE_ID;
const filePath = process.env.FILEPATH;
const environment = Environment.SANDBOX;
@Injectable()
export class SubscriptionFactory {
  private client: AppStoreServerAPIClient;
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
    async init() {
    const encodedKey = await new Promise<string>((res, rej) => {
      readFile(filePath, (err, data) => {
        if (err) return rej(err);
        res(data.toString());
      });
    });
    try {
      const serviceAccountPath = path.join(
        "./json",
        "/casttree-d50d2cec9329.json"
        // process.env.GOOGLE_FILE_PATH
      );
      console.log("serviceAccountPath", serviceAccountPath);

    } catch (err) {
      console.error("Failed to initialize androidpublisher", err);
    }
    // console.log("encodedKey", encodedKey);
    // console.log("env", issuerId, keyId, bundleId, filePath, environment);

    this.client = new AppStoreServerAPIClient(
      encodedKey,
      keyId,
      issuerId,
      bundleId,
      environment
    );
  }

  async getTransactionHistory(bodyData) {
    try {
      // const transactionId = "2000000889069745";
      // let response = null;
      // let transactions = [];
      // if (transactionId != null) {
      //   // try {
      //   //   const info = await this.client.getTransactionInfo(transactionId);
      //   //   console.log("Transaction Info:", info);
      //   // } catch (err) {
      //   //   console.error("Error fetching transaction info:", err);
      //   // }

      //   const transactionHistoryRequest = {
      //     sort: Order.ASCENDING,
      //     revoked: false,
      //     productTypes: [ProductType.AUTO_RENEWABLE],
      //   };

      //   do {
      //     const revisionToken = response?.revision ?? null;
      //     response = await this.client.getTransactionHistory(
      //       transactionId,
      //       revisionToken,
      //       transactionHistoryRequest,
      //       GetTransactionHistoryVersion.V2
      //     );
      //     console.log("response is", response);
      //     if (response.signedTransactions) {
      //       transactions = transactions.concat(response.signedTransactions);
      //     }
      //   } while (response.hasMore);

      //   // console.log("transactions",transactions);
      // }
      // if (transactions.length >= 0) {

      //   if (response.signedTransactions) {
      //     for (let token of response.signedTransactions) {
      //       const parsedTransaction = this.parseJwt(token);

      //       if (parsedTransaction) {
      //         // console.log("Decoded Transaction:", parsedTransaction);

      //         const transactionData = {
      //           transactionId: parsedTransaction.transactionId,
      //           productId: parsedTransaction.productId,
      //           expiresDate: parsedTransaction.expiresDate,
      //           purchaseDate: parsedTransaction.purchaseDate,
      //           isActive: new Date(parsedTransaction.expiresDate).getTime() > Date.now(),
      //           rawTransaction: parsedTransaction,
      //         };

      //         // transactions.push(transactionData);
      //       } else {
      //         console.error("Invalid JWT token:", token);
      //       }
      //     }
      //   }

      //   // console.log("All Transactions:", transactions);
      //   // return transactions;
      // }

      if (bodyData.notificationType == "DID_PURCHASE") {
        const purchaseInfo = await this.validatePurchase(bodyData.data.signedTransactionInfo);
        console.log("purchaseInfo", purchaseInfo);

        if (!purchaseInfo?.parsed) {
          return {
            success: false,
            message: "Invalid purchase transaction data",
          };
        }
        const parsed = purchaseInfo.parsed;
        return {
          success: true,
          isActive: new Date(parsed.expiresDate).getTime() > Date.now(),
          productId: parsed.productId,
          transactionId: parsed.transactionId,
          originalTransactionId: parsed.originalTransactionId,
          purchaseDate: new Date(parsed.purchaseDate).toISOString(),
          originalPurchaseDate:new Date( parsed.originalPurchaseDate).toISOString(),
          expiresDate: new Date(parsed.expiresDate).toISOString(),
          quantity: parsed.quantity,
          signedDate:parsed.signedDate,
          type:parsed.type,
          transactionReason:parsed.transactionReason,
          inAppOwnershipType: parsed.inAppOwnershipType,
          price: parsed.price,
          appAccountToken: parsed.appAccountToken,
          storefront: parsed.storefront,
          currency:parsed.currency,
          appTransactionId:parsed.appTransactionId,
          storefrontId: parsed.storefrontId,
          subscriptionGroupIdentifier: parsed.subscriptionGroupIdentifier,
          webOrderLineItemId: parsed.webOrderLineItemId,
          rawTransaction: parsed,
        };
      }
      else if (bodyData.notificationType == "DID_CANCEL") {
        const transaction = await this.validatePurchase(bodyData.data.signedTransactionInfo);
        const renewal = await this.validatePurchase(bodyData.data.signedRenewalInfo);
        console.log("transaction", transaction);
        console.log("renewal", renewal);
        const parsed = transaction.parsed;

        return {
          success: transaction.success,
          isActive: false,
          productId: parsed.productId,
          transactionId: parsed.transactionId,
          originalTransactionId: parsed.originalTransactionId,
          purchaseDate: new Date(parsed.purchaseDate).toISOString(),
          originalPurchaseDate: new Date(parsed.originalPurchaseDate).toISOString(),
          expiresDate: new Date(parsed.expiresDate).toISOString(),
          cancellationDate: new Date(parsed.cancellationDate).toISOString(),
          cancellationReason: parsed.cancellationReason,
          inAppOwnershipType: parsed.inAppOwnershipType,
          price: parsed.price,
          currency:parsed.currency,
          quantity:parsed.quantity,
          appTransactionId:parsed.appTransactionId,
          subscriptionGroupIdentifier: parsed.subscriptionGroupIdentifier,
          webOrderLineItemId: parsed.webOrderLineItemId,
          appAccountToken: parsed.appAccountToken,
          storefront: parsed.storefront,
          storefrontId: parsed.storefrontId,
          autoRenewStatus: renewal?.parsed?.autoRenewStatus,
          isInBillingRetryPeriod: renewal?.parsed?.isInBillingRetryPeriod,
          renewalProductId: renewal?.parsed?.renewalProductId,
          gracePeriodExpiresDate: new Date(renewal?.parsed?.gracePeriodExpiresDate).toISOString(),
          rawTransaction: parsed,
          rawRenewal: renewal?.parsed,
        };
      }
      else if(bodyData.notificationType==="DID_RENEW") {
        const validatePurchase = await this.validatePurchase(
          bodyData.data.signedTransactionInfo
        );
        console.log("validatePurchase", validatePurchase);
        const signedRenewalInfo = await this.validatePurchase(
          bodyData.data.signedRenewalInfo
        );
        console.log("signedRenewalInfo", validatePurchase);

        if (!validatePurchase?.parsed) {
          return {
            success: false,
            message: "Invalid transaction data",
          };
        }

        // const active = validatePurchase.parsed.expiresDate > Date.now();
        const parsed = validatePurchase.parsed;

        return {

          success: true,
          isActive: new Date(parsed.expiresDate).getTime() > Date.now(),
          productId: parsed.productId,
          transactionId: parsed.transactionId,
          originalTransactionId: parsed.originalTransactionId,
          purchaseDate: new Date(parsed.purchaseDate).toISOString(),
          originalPurchaseDate: new Date(parsed.originalPurchaseDate).toISOString(),
          expiresDate: new Date(parsed.expiresDate).toISOString(),
          renewalDate: new Date(signedRenewalInfo?.parsed?.renewalDate).toISOString(),
          inAppOwnershipType: parsed.inAppOwnershipType,
          price: parsed.price,
          subscriptionGroupIdentifier: parsed.subscriptionGroupIdentifier,
          webOrderLineItemId: parsed.webOrderLineItemId,
          appAccountToken: parsed.appAccountToken,
          storefront: parsed.storefront,
          storefrontId: parsed.storefrontId,
          rawTransaction: parsed,
          rawRenewal: signedRenewalInfo?.parsed,
        };
      }

    } catch (err) {
      console.log("Error in getTransactionHistory", err);
      throw err;
    }
  }

  parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join('')
      );
      console.log("json payload", JSON.stringify(jsonPayload))
      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error("Error while parsing JWT:", err, token);
      return null;
    }
  }

  async validatePurchase(signedTransactionInfo) {
    try {
      const parsed = this.parseJwt(signedTransactionInfo);
      if (!parsed) {
        return {
          success: false,
          message: "Failed to parse or decode JWT.",
        };
      }

      return {
        success: parsed.expiresDate > Date.now(),
        parsed,
      };
    } catch (error) {
      console.log("Error in validatePurchase", error);
      throw error;
    }
  }
}
