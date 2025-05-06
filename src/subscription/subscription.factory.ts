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
const { google } = require('googleapis');
import {
  AppStoreServerAPIClient,
  Environment,
  GetTransactionHistoryVersion,
  Order,
  ProductType,
} from "@apple/app-store-server-library";
import { EEventType } from "./enums/eventType.enum";
const issuerId = process.env.ISSUER_ID;
const keyId = process.env.KEY_ID;
const bundleId = process.env.BUNDLE_ID;
const filePath = process.env.FILEPATH;
const environment = Environment.SANDBOX;
const googleFile = process.env.GOOGLE_FILE_PATH; 
@Injectable()
export class SubscriptionFactory {
  private client: AppStoreServerAPIClient;
  private androidpublisher: any;
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
  async onModuleInit() {
    await this.init();
  }
  getProvider(providerName: string): SubscriptionProvider {
    const providers: Record<string, SubscriptionProvider> = {
      razorpay: {
        createSubscription: async (data: any, bodyData, token: UserToken) =>
          this.handleRazorpaySubscription(data, bodyData, token),
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
    try {
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
        payment_amount:
          subscription?.authorization_details?.authorization_amount,
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
        provider: EProvider.cashfree,
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
        provider: EProvider.cashfree,
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
    } catch (err) {
      throw err;
    }
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
    let currencyId = await this.helperService.getCurrencyId(
      bodyData.currencyCode
    );
    // console.log("currencyId", currencyId);
    let currencyResponse = currencyId?.data?.[0];
    let subscriptionData = {
      userId: token.id,
      planId: data.planId,
      startAt: data.startAt,
      providerId: data.providerId,
      provider: data.provider,
      amount: parseInt(bodyData.authAmount),
      notes: data.notes,
      subscriptionStatus: data.subscriptionStatus,
      createdBy: token?.id,
      updatedBy: token?.id,
      metaData: data.metaData,
      externalId: transactionId,
      currencyCode: currencyResponse.currency_code,
      currencyId: currencyResponse._id,
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
      currencyCode: currencyResponse.currency_code,
      currency: currencyResponse._id,
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
      currencyCode: currencyResponse.currency_code,
      currency: currencyResponse._id,
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
    };
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
    let currencyId = await this.helperService.getCurrencyId(
      bodyData.currencyCode
    );
    // console.log("currencyId", currencyId);
    let currencyResponse = currencyId?.data?.[0];
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
      currencyCode: currencyResponse.currency_code,
      currencyId: currencyResponse._id,
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
      currencyCode: currencyResponse.currency_code,
      currency: currencyResponse._id,
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
      currencyCode: currencyResponse.currency_code,
      currency: currencyResponse._id,
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
      const auth = new google.auth.GoogleAuth({
        keyFile: googleFile,
        scopes: ["https://www.googleapis.com/auth/androidpublisher"],
      });
      // console.log("auth", auth);
      this.androidpublisher = google.androidpublisher({
        version: "v3",
        auth: auth,
      });
      // console.log("androidpublisher initialized successfully");

    } catch (err) {
      throw err
      // console.error("Failed to initialize androidpublisher", err);
    }
    // console.log("encodedKey", encodedKey);
    // console.log("client", encodedKey, keyId, issuerId, bundleId, environment);

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
      // console.log("bodyData",bodyData);
      const purchaseInfo = await this.validatePurchase(
        bodyData?.data?.signedTransactionInfo
      );
      // console.log("purchaseInfo:", purchaseInfo);

      const transactionId = purchaseInfo?.parsed?.transactionId;
      let response = null;
      let transactions = [];
      if (transactionId != null) {
        const transactionHistoryRequest = {
          sort: Order.ASCENDING,
          revoked: false,
          productTypes: [ProductType.AUTO_RENEWABLE],
        };
        do {
          const revisionToken =
            response !== null && response.revision !== null
              ? response.revision
              : null;
          response = await this.client.getTransactionHistory(
            transactionId,
            revisionToken,
            transactionHistoryRequest,
            GetTransactionHistoryVersion.V2
          );
          // console.log("response is", response)
          if (response.signedTransactions) {
            transactions = transactions.concat(response?.signedTransactions);
          }
        } while (response.hasMore);

        // console.log("transactions",transactions);
      }
      const latestSignedTransaction = transactions[transactions.length - 1];
      const decodeData = await this.parseJwt(latestSignedTransaction);
      // console.log("decodeData", decodeData);

      if (bodyData.notificationType === EEventType.didPurchase) {
        let signedRenewalInfo = await this.parseJwt(
          bodyData?.data?.signedRenewalInfo
        );
        // console.log("signedRenewalInfo", signedRenewalInfo);
        const priceMicros = purchaseInfo?.parsed?.price;
        const price = priceMicros / 1000;
        let transactionDetails = {
          transactionId: purchaseInfo?.parsed?.transactionId,
          originalTransactionId: purchaseInfo?.parsed?.originalTransactionId,
          webOrderLineItemId: purchaseInfo?.parsed?.webOrderLineItemId,
          bundleId: purchaseInfo?.parsed?.bundleId,
          productId: purchaseInfo?.parsed?.productId,
          subscriptionGroupIdentifier:
            purchaseInfo?.parsed?.subscriptionGroupIdentifier,
          purchaseDate: new Date(
            purchaseInfo?.parsed?.purchaseDate
          ).toISOString(),
          originalPurchaseDate: new Date(
            purchaseInfo?.parsed?.originalPurchaseDate
          ).toISOString(),
          expiresDate: new Date(
            purchaseInfo?.parsed?.expiresDate
          ).toISOString(),
          quantity: purchaseInfo?.parsed?.quantity,
          type: purchaseInfo?.parsed?.type,
          inAppOwnershipType: purchaseInfo?.parsed?.inAppOwnershipType,
          signedDate: new Date(purchaseInfo?.parsed?.signedDate).toISOString(),
          environment: purchaseInfo?.parsed?.environment,
          transactionReason: purchaseInfo?.parsed?.transactionReason,
          storefront: purchaseInfo?.parsed?.storefront,
          storefrontId: purchaseInfo?.parsed?.storefrontId,
          price: price,
          currency: purchaseInfo?.parsed?.currency,
          appTransactionId: purchaseInfo?.parsed?.appTransactionId,
        };
        const renewalPriceMicros = signedRenewalInfo?.renewalPrice;
        const renewalPrice = renewalPriceMicros / 1000;
        const renewalDetails = {
          originalTransactionId: signedRenewalInfo?.originalTransactionId,
          autoRenewProductId: signedRenewalInfo?.autoRenewProductId,
          productId: signedRenewalInfo?.productId,
          autoRenewStatus: signedRenewalInfo?.autoRenewStatus,
          renewalPrice: renewalPrice,
          currency: signedRenewalInfo?.currency,
          signedDate: new Date(signedRenewalInfo?.signedDate).toISOString(),
          environment: signedRenewalInfo?.environment,
          recentSubscriptionStartDate: new Date(
            signedRenewalInfo?.recentSubscriptionStartDate
          ).toISOString(),
          renewalDate: new Date(signedRenewalInfo?.renewalDate).toISOString(),
          appTransactionId: signedRenewalInfo?.appTransactionId,
        };
        return {
          transactions: transactionDetails,
          renewalInfo: renewalDetails,
        };
      } else if (bodyData.notificationType === EEventType.didCancel) {
        let signedRenewalInfo = await this.parseJwt(
          bodyData?.data?.signedRenewalInfo
        );
        // console.log("signedRenewalInfo", signedRenewalInfo);
        const priceMicros = purchaseInfo?.parsed?.price;
        const price = priceMicros / 1000;
        let transactionDetails = {
          transactionId: purchaseInfo?.parsed?.transactionId,
          originalTransactionId: purchaseInfo?.parsed?.originalTransactionId,
          webOrderLineItemId: purchaseInfo?.parsed?.webOrderLineItemId,
          bundleId: purchaseInfo?.parsed?.bundleId,
          productId: purchaseInfo?.parsed?.productId,
          revocationReason: purchaseInfo?.parsed?.revocationReason,
          subscriptionGroupIdentifier:
            purchaseInfo?.parsed?.subscriptionGroupIdentifier,
          purchaseDate: new Date(
            purchaseInfo?.parsed?.purchaseDate
          ).toISOString(),
          revocationDate: new Date(
            purchaseInfo?.parsed?.revocationDate
          ).toISOString(),
          expiresDate: new Date(
            purchaseInfo?.parsed?.expiresDate
          ).toISOString(),
          quantity: purchaseInfo?.parsed?.quantity,
          type: purchaseInfo?.parsed?.type,
          inAppOwnershipType: purchaseInfo?.parsed?.inAppOwnershipType,
          environment: purchaseInfo?.parsed?.environment,
          transactionReason: purchaseInfo?.parsed?.transactionReason,
          storefront: purchaseInfo?.parsed?.storefront,
          storefrontId: purchaseInfo?.parsed?.storefrontId,
          price: price,
          currency: purchaseInfo?.parsed?.currency,
          appTransactionId: purchaseInfo?.parsed?.appTransactionId,
          appAccountToken: purchaseInfo?.parsed?.appAccountToken,
          isUpgraded: purchaseInfo?.parsed?.isUpgraded,
        };
        const renewalPriceMicros = signedRenewalInfo?.renewalPrice;
        const renewalPrice = renewalPriceMicros / 1000;
        // console.log("renewalPrice",renewalPrice.toFixed(2));
        const renewalDetails = {
          originalTransactionId: signedRenewalInfo?.originalTransactionId,
          autoRenewProductId: signedRenewalInfo?.autoRenewProductId,
          productId: signedRenewalInfo?.productId,
          autoRenewStatus: signedRenewalInfo?.autoRenewStatus,
          renewalPrice: renewalPrice,
          currency: signedRenewalInfo?.currency,
          signedDate: new Date(signedRenewalInfo?.signedDate).toISOString(),
          environment: signedRenewalInfo?.environment,
          recentSubscriptionStartDate: new Date(
            signedRenewalInfo?.recentSubscriptionStartDate
          ).toISOString(),
          renewalDate: new Date(signedRenewalInfo?.renewalDate).toISOString(),
          appTransactionId: signedRenewalInfo?.appTransactionId,
        };
        return {
          transactions: transactionDetails,
          renewalInfo: renewalDetails,
        };
      } else if (bodyData.notificationType === EEventType.didRenew) {
        let signedRenewalInfo = await this.parseJwt(
          bodyData?.data?.signedRenewalInfo
        );
        // console.log("signedRenewalInfo", signedRenewalInfo);
        const priceMicros = purchaseInfo?.parsed?.price;
        const price = priceMicros / 1000;
        let transactionDetails = {
          transactionId: purchaseInfo?.parsed?.transactionId,
          originalTransactionId: purchaseInfo?.parsed?.originalTransactionId,
          webOrderLineItemId: purchaseInfo?.parsed?.webOrderLineItemId,
          bundleId: purchaseInfo?.parsed?.bundleId,
          productId: purchaseInfo?.parsed?.productId,
          subscriptionGroupIdentifier:
            purchaseInfo?.parsed?.subscriptionGroupIdentifier,
          purchaseDate: new Date(
            purchaseInfo?.parsed?.purchaseDate
          ).toISOString(),
          originalPurchaseDate: new Date(
            purchaseInfo?.parsed?.originalPurchaseDate
          ).toISOString(),
          expiresDate: new Date(
            purchaseInfo?.parsed?.expiresDate
          ).toISOString(),
          quantity: purchaseInfo?.parsed?.quantity,
          type: purchaseInfo?.parsed?.type,
          inAppOwnershipType: purchaseInfo?.parsed?.inAppOwnershipType,
          environment: purchaseInfo?.parsed?.environment,
          transactionReason: purchaseInfo?.parsed?.transactionReason,
          storefront: purchaseInfo?.parsed?.storefront,
          storefrontId: purchaseInfo?.parsed?.storefrontId,
          price: price,
          currency: purchaseInfo?.parsed?.currency,
          appTransactionId: purchaseInfo?.parsed?.appTransactionId,
        };
        const renewalPriceMicros = signedRenewalInfo?.renewalPrice;
        const renewalPrice = renewalPriceMicros / 1000;
        const renewalDetails = {
          originalTransactionId: signedRenewalInfo?.originalTransactionId,
          autoRenewProductId: signedRenewalInfo?.autoRenewProductId,
          productId: signedRenewalInfo?.productId,
          autoRenewStatus: signedRenewalInfo?.autoRenewStatus,
          renewalPrice: renewalPrice,
          currency: signedRenewalInfo?.currency,
          signedDate: new Date(signedRenewalInfo?.signedDate).toISOString(),
          environment: signedRenewalInfo?.environment,
          recentSubscriptionStartDate: new Date(
            signedRenewalInfo?.recentSubscriptionStartDate
          ).toISOString(),
          renewalDate: new Date(signedRenewalInfo?.renewalDate).toISOString(),
          appTransactionId: signedRenewalInfo?.appTransactionId,
        };
        return {
          transactions: transactionDetails,
          renewalInfo: renewalDetails,
        };
      } else if (bodyData.notificationType === EEventType.expired) {
        let signedRenewalInfo = await this.parseJwt(
          bodyData?.data?.signedRenewalInfo
        );
        // console.log("signedRenewalInfo", signedRenewalInfo);
        const renewalPriceMicros = purchaseInfo?.parsed?.price;
        const renewalPrice = renewalPriceMicros / 1000;
        let transactionDetails = {
          transactionId: purchaseInfo?.parsed?.transactionId,
          originalTransactionId: purchaseInfo?.parsed?.originalTransactionId,
          webOrderLineItemId: purchaseInfo?.parsed?.webOrderLineItemId,
          bundleId: purchaseInfo?.parsed?.bundleId,
          productId: purchaseInfo?.parsed?.productId,
          subscriptionGroupIdentifier:
            purchaseInfo?.parsed?.subscriptionGroupIdentifier,
          purchaseDate: new Date(
            purchaseInfo?.parsed?.purchaseDate
          ).toISOString(),
          originalPurchaseDate: new Date(
            purchaseInfo?.parsed?.originalPurchaseDate
          ).toISOString(),
          expiresDate: new Date(
            purchaseInfo?.parsed?.expiresDate
          ).toISOString(),
          quantity: purchaseInfo?.parsed?.quantity,
          type: purchaseInfo?.parsed?.type,
          inAppOwnershipType: purchaseInfo?.parsed?.inAppOwnershipType,
          signedDate: new Date(purchaseInfo?.parsed?.signedDate).toISOString(),
          environment: purchaseInfo?.parsed?.environment,
          transactionReason: purchaseInfo?.parsed?.transactionReason,
          storefront: purchaseInfo?.parsed?.storefront,
          storefrontId: purchaseInfo?.parsed?.storefrontId,
          price: renewalPrice,
          currency: purchaseInfo?.parsed?.currency,
          appTransactionId: purchaseInfo?.parsed?.appTransactionId,
        };

        const renewalDetails = {
          expirationIntent: signedRenewalInfo?.expirationIntent,
          originalTransactionId: signedRenewalInfo?.originalTransactionId,
          autoRenewProductId: signedRenewalInfo?.autoRenewProductId,
          productId: signedRenewalInfo?.productId,
          autoRenewStatus: signedRenewalInfo?.autoRenewStatus,
          isInBillingRetryPeriod: signedRenewalInfo?.isInBillingRetryPeriod,
          signedDate: new Date(signedRenewalInfo?.signedDate).toISOString(),
          environment: signedRenewalInfo?.environment,
          recentSubscriptionStartDate: new Date(
            signedRenewalInfo?.recentSubscriptionStartDate
          ).toISOString(),
          renewalDate: new Date(signedRenewalInfo?.renewalDate).toISOString(),
          appTransactionId: signedRenewalInfo?.appTransactionId,
        };
        return {
          transactions: transactionDetails,
          renewalInfo: renewalDetails,
        };
      }
    } catch (err) {
      console.log("Error in getTransactionHistory", err);
      throw err;
    }
  }

  parseJwt(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join("")
      );
      // console.log("json payload", JSON.stringify(jsonPayload))
      return JSON.parse(jsonPayload);
    } catch (err) {
      // console.error("Error while parsing JWT:", err, token);
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
      // console.log("Error in validatePurchase", error);
      throw error;
    }
  }

  async googleRtdn(message) {
    try {
      // let sampleCode = {
      //   "message": {
      //     "data": "eyJ2ZXJzaW9uIjoiMS4wIiwicGFja2FnZU5hbWUiOiJjb20uYmlsbGlvbmZhY2VzLmNhc3R0cmVlIiwiZXZlbnRUaW1lTWlsbGlzIjoiMTc0NDcxNzkzOTQxOSIsInN1YnNjcmlwdGlvbk5vdGlmaWNhdGlvbiI6eyJ2ZXJzaW9uIjoiMS4wIiwibm90aWZpY2F0aW9uVHlwZSI6MywicHVyY2hhc2VUb2tlbiI6ImlwbGJuZWFkb2hwaHBwYm1mamZvYmhqbC5BTy1KMU93dGo3RS1VNFZIeU10ZUFsMWVJU2FsN01EUmc4bks5ejdrSGZvaGhNM0J3RWg4MWROWGxMRzlUa0dacE96U2U0S1ZDVF9HSDRsbmlTOVhDV2FIWmRwVXFvclBnU1NqUlI5cXQwRWhSemhDeG91bG1fNCIsInN1YnNjcmlwdGlvbklkIjoiY2FzXzlfMW1fMGQwIn19",
      //     "messageId": "13910944166364695",
      //     "message_id": "13910944166364695",
      //     "publishTime": "2025-04-15T11:52:19.553Z",
      //     "publish_time": "2025-04-15T11:52:19.553Z"
      //   },
      //   "subscription": "projects/casttree/subscriptions/play-rtdn-sub"
      // }
      const pubSubMessage = message;
      // console.log("pubSubMessage", pubSubMessage);
      const messageBuffer = Buffer.from(pubSubMessage.data, 'base64');
      const notification = JSON.parse(messageBuffer.toString());
      // console.log('📬 RTDN received:', notification);
      const { subscriptionNotification } = notification;
      // console.log("subscriptionNotification", subscriptionNotification);
      const { notificationType, purchaseToken, subscriptionId } = subscriptionNotification;
      // console.log("notificationType", notificationType, subscriptionId);

      const verification = await this.validateTransactions(
        notification.packageName,
        purchaseToken
      );

      let verificationData = {
        ...verification,
        purchaseToken: purchaseToken,
        notificationType: notificationType
      }
      // console.log("verification", verification);

      return verificationData;
    } catch (err) {
      throw err;
      // console.error('❌ Error handling RTDN:', err);
    }
  }

  async validateTransactions(packageName, data) {
    try {
      // console.log("packageName", packageName, data);

      const res = await this.androidpublisher.purchases.subscriptionsv2.get({
        packageName: packageName,
        token: data,
      });
      const transactionInfo = res.data;
      // console.log("transactionInfo", transactionInfo);

      return {
        success: res.data.expiryTime > new Date(),
        transactionInfo,
      };
    } catch (err) {
      // console.error("Failed to get transaction", err);
      throw err;
    }
  }

  private async handleRazorpaySubscription(data, bodyData, token) {
    try {
      // console.log("data in razorpay", data);

      let userAdditionalData =
        await this.helperService.getUserAdditionalDetails({ userId: token.id });
      // console.log("userAdditionalData", userAdditionalData);
      let customer;
      if (!userAdditionalData?.userAdditional?.referenceId) {
        customer = await this.helperService.createCustomer(
          {
            userName: userAdditionalData?.userAdditional?.userId?.userName,
            email: userAdditionalData?.userAdditional?.userId?.emailId,
            phoneNumber:
              userAdditionalData?.userAdditional?.userId?.phoneNumber,
          },
          token
        );
        // console.log("customer", customer);
        await this.helperService.updateUserAdditional({
          userId: token.id,
          referenceId: customer?.id,
        });
      }
      let customerId =
        userAdditionalData?.userAdditional?.referenceId || customer?.id;
      // console.log("customerId", customerId);

      let fv = {
        ...data,
        customer_id: customerId,
      };
      // console.log("fv is", fv);

      const subscription = await this.helperService.addSubscription(fv);
      let endDate = new Date(data?.firstCharge);
      endDate.setHours(23, 59, 59, 999); // modifies in-place
      let endAt = endDate;
      // console.log("endAt is", endAt);

      const subscriptionData = {
        userId: token.id,
        subscriptionId: data?.subscription_id,
        startAt: new Date().toISOString(),
        endAt: endAt,
        providerId: 1,
        provider: EProvider.razorpay,
        amount: parseInt(data?.authAmount),
        currencyCode: data?.currency,
        notes: { itemId: data?.itemId },
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
        amount: data?.subscriptionAmount,
        providerId: 1,
        provider: EProvider.razorpay,
        currency: data?.currency,
        frequency: "ON_DEMAND",
        mandateStatus: EMandateStatus.initiated,
        status: EStatus.Active,
        metaData: {
          customerId: customerId,
          orderId: subscription?.id,
          subscriptionId: data?.subscription_id,
        },
        startDate: data.firstCharge,
        endDate: data.expiryTime,
      };
      // console.log("mandate data", mandateData);
      let mandate = await this.mandateService.addMandate(mandateData, token);

      await this.mandateHistoryService.createMandateHistory({
        mandateId: mandate._id,
        mandateStatus: EMandateStatus.initiated,
        status: EStatus.Active,
        metaData: { customerId: customerId },
        createdBy: token.id,
        updatedBy: token.id,
      });

      const invoiceData = {
        itemId: data.itemId,
        source_id: subscriptionCreated._id,
        source_type: "subscription",
        sub_total: data.authAmount,
        currencyCode: data?.currencyCode,
        document_status: EDocumentStatus.pending,
        grand_total: data.authAmount,
        user_id: token.id,
        created_by: token.id,
        updated_by: token.id,
      };
      const invoice = await this.invoiceService.createInvoice(invoiceData);

      const paymentData = {
        amount: data.authAmount,
        currencyCode: data.currency,
        document_status: EDocumentStatus.pending,
        paymentType: EPaymentType.auth,
        providerId: 1,
        providerName: EProvider.razorpay,
      };
      await this.paymentService.createPaymentRecord(
        paymentData,
        token,
        invoice,
        data?.currencyCode,
        { order_id: subscription.id }
      );
      // console.log("returning data");

      return {
        subscriptionDetails: { customerId: customerId, ...subscription },
      };
    } catch (err) {
      throw err;
    }
  }
}
