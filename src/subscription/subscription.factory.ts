import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { HelperService } from "src/helper/helper.service";
import { EDocumentStatus } from "src/invoice/enum/document-status.enum";
import { InvoiceService } from "src/invoice/invoice.service";
import { EMandateStatus } from "src/mandates/enum/mandate.enum";
import { MandateHistoryService } from "src/mandates/mandate-history/mandate-history.service";
import { EPaymentSourceType, EPaymentType, ETransactionType } from "src/payment/enum/payment.enum";
import { PaymentRequestService } from "src/payment/payment-request.service";
import { EStatus } from "src/shared/enum/privacy.enum";
import { SharedService } from "src/shared/shared.service";
import { MandatesService } from "../mandates/mandates.service";
import { EsubscriptionStatus } from "./../process/enums/process.enum";
import { EProvider, EProviderId, EProviderName, ESubscriptionMode } from "./enums/provider.enum";
import { SubscriptionProvider } from "./subscription.interface";
import { SubscriptionService } from "./subscription.service";
import { readFile } from "fs";
import * as path from "path";
const { google } = require("googleapis");
const { ObjectId } = require("mongodb");
import {
  AppStoreServerAPIClient,
  Environment,
  GetTransactionHistoryVersion,
  Order,
  ProductType,
} from "@apple/app-store-server-library";
import { EEventType } from "./enums/eventType.enum";
import { ItemService } from "src/item/item.service";
import { EMixedPanelEvents } from "src/helper/enums/mixedPanel.enums";
import { EDocumentTypeName } from "src/invoice/enum/document-type-name.enum";
import { RedisService } from "src/redis/redis.service";
const issuerId = process.env.ISSUER_ID;
const keyId = process.env.KEY_ID;
const bundleId = process.env.BUNDLE_ID;
const filePath = process.env.FILEPATH;
const environment = Environment.SANDBOX;
const prodEnvironment = Environment.PRODUCTION;
const googleFile = process.env.GOOGLE_FILE_PATH;
const packageName = process.env.PACKAGE_NAME;
const scopes = process.env.SCOPES;
@Injectable()
export class SubscriptionFactory {
  private client: AppStoreServerAPIClient;
  private androidpublisher: any;
  constructor(
    @Inject(forwardRef(() => HelperService))
    private readonly helperService: HelperService,
    private readonly sharedService: SharedService,
    private readonly mandateService: MandatesService,
    private readonly mandateHistoryService: MandateHistoryService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    private readonly invoiceService: InvoiceService,
    @Inject(forwardRef(() => PaymentRequestService))
    private readonly paymentService: PaymentRequestService,
    private readonly itemService: ItemService,
    @Inject(forwardRef(() => RedisService))
    private readonly redisService: RedisService
  ) {}
  // async onModuleInit() {
  //   await this.init();
  // }
  getProvider(providerName: string): SubscriptionProvider {
    // console.log("providerName", providerName);

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
      let existingSubscription = await this.subscriptionService.getSubscriptionByUserId( token.id)
      let startAt: Date;
      let endAt: Date;

      if (existingSubscription) {
        let itemdetail = await this.itemService.getItemDetail(bodyData?.itemId)
        startAt = new Date(new Date(existingSubscription.endAt).getTime() + 2000);
        let subscriptionData = await this.subscriptionService.validateSubscription(token.id, [
          EsubscriptionStatus.initiated,
          EsubscriptionStatus.failed,
        ]);

        startAt = new Date(new Date(existingSubscription?.endAt).getTime() + 2000);

        let endAtValidity = bodyData?.refId || subscriptionData ? itemdetail?.additionalDetail?.promotionDetails?.subscriptionDetail?.validity : itemdetail?.additionalDetail?.promotionDetails?.authDetail?.validity
        let endAtValidityType = bodyData?.refId || subscriptionData ? itemdetail?.additionalDetail?.promotionDetails?.subscriptionDetail?.validityType : itemdetail?.additionalDetail?.promotionDetails?.authDetail?.validityType
        endAt = new Date(startAt);
        if (endAtValidityType === 'day') {
          endAt.setDate(endAt.getDate() + endAtValidity);
        } else if (endAtValidityType === 'month') {
          endAt.setMonth(endAt.getMonth() + endAtValidity);
        } else if (endAtValidityType === 'year') {
          endAt.setFullYear(endAt.getFullYear() + endAtValidity);
        }
        endAt.setUTCHours(18, 29, 59, 999);
        
      } else {
        startAt = new Date();
        let endDate = new Date(bodyData?.firstCharge);
        endDate.setUTCHours(18, 29, 59, 999);
        endAt = endDate;
      }
      const subscriptionData = {
        userId: token.id,
        planId: subscription?.plan_details?.plan_id,
        startAt: startAt.toISOString(),
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
        amount: subscription?.authorization_details?.authorization_amount,
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
        mandateId: mandate?._id.toString(),
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
        sub_total: subscription?.authorization_details?.authorization_amount,
        currencyCode: "INR",
        document_status: EDocumentStatus.pending,
        grand_total: subscription?.authorization_details?.authorization_amount,
        user_id: token.id,
        created_by: token.id,
        updated_by: token.id,
      };
      const invoice = await this.invoiceService.createInvoice(
        invoiceData,
        token.id
      );

      const paymentData = {
        amount: subscription?.authorization_details?.authorization_amount,
        currencyCode: "INR",
        document_status: EDocumentStatus.pending,
        paymentType: EPaymentType.auth,
        providerId: 2,
        providerName: EProvider.cashfree,
      };
      let payment = await this.paymentService.createPaymentRecord(
        paymentData,
        token,
        invoice,
        "INR",
        { order_id: auth.cf_payment_id }
      );
      // console.log("returning data");

      return {
        subscriptionDetails: {
        ...subscription,
        paymentId: payment?.id,
        },
        authorizationDetails: auth,
      };
    } catch (err) {
      throw err;
    }
  }

  private async handleAppleIAPSubscription(data, bodyData, token: UserToken) {
    try {
      // console.log("apple iap bodyData", bodyData, data);

      const transactionId = bodyData.transactionDetails?.transactionId;
      // console.log("transactionId", transactionId);
      const originalTransactionId =
        data?.transactionDetails?.originalTransactionId ||
        bodyData?.transactionDetails?.transactionId;
      // console.log("originalTransactionId", originalTransactionId);

      const existingSubscription =
        await this.subscriptionService.findAppleExternalId(
          originalTransactionId,
          transactionId,
          token?.id
        );
      if (!existingSubscription) {
        const matchingTransaction = await this.getTransactionHistoryById(
          originalTransactionId
        );
        console.log("matchingTransaction", matchingTransaction);

        // Check if transaction was found
        if (!matchingTransaction) {
          console.log(
            "No matching transaction found for:",
            originalTransactionId
          );
          return null;
        }
        // console.log("matchingTransaction", JSON.stringify(matchingTransaction));
        // if (existingSubscription) {
        //   // console.log("existingSubscription", existingSubscription);
        //   return existingSubscription;
        // }
        const price = matchingTransaction?.price / 1000;
        const formattedPrice = Number(price.toFixed(2));
        const currencyCode = matchingTransaction?.currency;
        const currencyIdRes =
          await this.helperService.getCurrencyId(currencyCode);
        const currencyResponse = currencyIdRes?.data?.[0];
        const expiresDateRaw = matchingTransaction?.expiresDate;
        const subscriptionEnd = new Date(expiresDateRaw).toISOString();
        // let provider = EProviderId.apple
        const item = await this.itemService.getItemByPlanConfig(
          bodyData?.planId,
          bodyData?.providerId
        );
        const subscriptionData = {
          userId: token?.id,
          planId: data?.planId,
          startAt: new Date(),
          endAt: subscriptionEnd,
          providerId: data.providerId,
          provider: data.provider,
          amount: formattedPrice,
          notes: { itemId: item?._id },
          subscriptionStatus: EsubscriptionStatus.active,
          createdBy: token?.id,
          updatedBy: token?.id,
          metaData: {
            transaction: {
              transactionId: matchingTransaction?.transactionId,
              originalTransactionId: matchingTransaction?.originalTransactionId,
              webOrderLineItemId: matchingTransaction?.webOrderLineItemId,
              bundleId: matchingTransaction?.bundleId,
              productId: matchingTransaction?.productId,
              subscriptionGroupIdentifier:
                matchingTransaction?.subscriptionGroupIdentifier,
              purchaseDate: matchingTransaction?.purchaseDate,
              originalPurchaseDate: matchingTransaction?.originalPurchaseDate,
              expiresDate: subscriptionEnd,
              quantity: matchingTransaction?.quantity,
              type: matchingTransaction?.type,
              inAppOwnershipType: matchingTransaction?.inAppOwnershipType,
              signedDate: matchingTransaction?.signedDate,
              environment: matchingTransaction?.environment,
              transactionReason: matchingTransaction?.transactionReason,
              storefront: matchingTransaction?.storefront,
              storefrontId: matchingTransaction?.storefrontId,
              price: price,
              currency: matchingTransaction?.currency,
              appTransactionId: matchingTransaction?.appTransactionId,
            },
          },
          transactionDetails: {
            transactionId: matchingTransaction?.transactionId,
            originalTransactionId: matchingTransaction?.originalTransactionId,
            authAmount: bodyData?.authAmount,
            transactionDate: bodyData?.transactionDate,
            planId: bodyData?.planId,
          },
          externalId: matchingTransaction?.originalTransactionId,
          currencyCode: currencyResponse?.currency_code,
          currencyId: currencyResponse?._id,
        };
        const createdSubscription = await this.subscriptionService.subscription(
          subscriptionData,
          token
        );
        const userBody = {
          userId: createdSubscription?.userId,
          membership: item?.itemName,
          badge: item?.additionalDetail?.badge,
        };
        await this.helperService.updateUser(userBody);
        const invoiceData = {
          itemId: item?._id,
          source_id: createdSubscription?._id,
          source_type: "subscription",
          sub_total: formattedPrice,
          document_status: EDocumentStatus.completed,
          grand_total: formattedPrice,
          user_id: token?.id,
          created_by: token?.id,
          updated_by: token?.id,
          currencyCode: currencyResponse?.currency_code,
          currency: currencyResponse?._id,
        };
        const invoice = await this.invoiceService.createInvoice(
          invoiceData,
          token.id
        );

        const conversionRateAmt = await this.helperService.getConversionRate(
          currencyCode,
          price
        );
        const baseAmount = Math.round(formattedPrice * conversionRateAmt);
        const paymentData = {
          amount: formattedPrice,
          document_status: EDocumentStatus.completed,
          providerId: EProviderId.apple,
          providerName: EProvider.apple,
          transactionDate: new Date(),
          metaData: {
            externalId: matchingTransaction?.originalTransactionId,
            latestOrderId: matchingTransaction?.transactionInfo?.latestOrderId,
          },
          currencyCode: currencyResponse?.currency_code,
          currencyId: currencyResponse?._id,
          baseAmount: baseAmount.toFixed(2),
          baseCurrency: currencyCode,
          conversionRate: conversionRateAmt,
          paymentType: "Auth",
        };
        let paymentDetails = await this.paymentService.createPaymentRecord(
          paymentData,
          token,
          invoice
        );

        const mandateData = {
          sourceId: createdSubscription?._id,
          userId: token?.id,
          paymentMethod: "ONLINE",
          amount: formattedPrice,
          providerId: EProviderId.apple,
          currency: currencyResponse?.currency_code,
          planId: data?.planId,
          mandateStatus: EDocumentStatus?.active,
          status: EStatus.Active,
          metaData: {
            externalId: matchingTransaction?.originalTransactionId,
          },
          startDate: new Date(),
          endDate: bodyData?.mandateExpiryTime,
        };
        const mandate = await this.mandateService.addMandate(
          mandateData,
          token
        );
        await this.mandateHistoryService.createMandateHistory({
          mandateId: mandate?._id.toString(),
          mandateStatus: EDocumentStatus.active,
          status: EStatus.Active,
          metaData: {
            externalId: matchingTransaction?.originalTransactionId,
          },
          createdBy: token?.id,
          updatedBy: token?.id,
        });

        const subscriptionCount = await this.subscriptionService.countUserSubscriptions(token?.id);

        let mixPanelBody: any = {};
        mixPanelBody.eventName = EMixedPanelEvents.subscription_add;
        mixPanelBody.distinctId = token.id;
        mixPanelBody.properties = {
          user_id: token?.id,
          provider: EProvider.apple,
          subscription_id: createdSubscription?._id,
          subscription_status: createdSubscription?.subscriptionStatus,
          subscription_date: createdSubscription?.startAt,
          item_name: item?.itemName,
          subscription_expired: createdSubscription?.endAt,
          subscription_count: subscriptionCount,
          subscription_mode: ESubscriptionMode.Auth,
          subscription_amount: formattedPrice
        };
        await this.helperService.mixPanel(mixPanelBody);
        let firstSubscription = await this.subscriptionService.userFirstSubscription(token?.id);
        let propertie = {
          first_subscription_date: firstSubscription?.startAt
        }
        await this.helperService.setUserProfile({ distinctId: token?.id,properties: propertie});     
        let isFirstPayment = await this.paymentService.getFirstPaymentByUserId(token?.id);
        let finalResponse:any = createdSubscription.toObject()
        if (isFirstPayment && paymentDetails?._id.toString() === isFirstPayment?._id.toString()) {
          finalResponse = {
            ...createdSubscription.toObject(),
            isFirstPayment: true,
            paymentId: isFirstPayment?._id
          }
        }
        return finalResponse;
      }
      return existingSubscription;
    } catch (error) {
      throw error;
    }
  }

  private async hanldeGoogleIAPSubscription(data, bodyData, token: UserToken) {
    try {
      console.log("body data", data, bodyData);

      let transactionId = bodyData.transactionDetails?.transactionId;
      let existingSubscription =
        await this.subscriptionService.findGoogleExternalId(
          transactionId,
          token?.id
        );
      if (!existingSubscription) {
        let matchingTransaction = await this.validateTransactions(
          packageName,
          transactionId
        );
        // console.log("matchingTransaction", matchingTransaction);
        const rawPrice =
          matchingTransaction?.transactionInfo?.lineItems[0]?.autoRenewingPlan
            ?.recurringPrice?.units;
        const price = Number(rawPrice);
        const formattedPrice = Number(price.toFixed(2));
        const currencyCode =
          matchingTransaction?.transactionInfo?.lineItems[0]?.autoRenewingPlan
            ?.recurringPrice?.currencyCode;
        const currencyIdRes =
          await this.helperService.getCurrencyId(currencyCode);
        const currencyResponse = currencyIdRes?.data?.[0];

        // let currencyId = await this.helperService.getCurrencyId(
        //   bodyData.currencyCode
        // );
        // let currencyResponse = currencyId?.data?.[0];
        // let provider = EProviderId.google
        const item = await this.itemService.getItemByPlanConfig(
          bodyData?.planId,
          bodyData?.providerId
        );
        const subscriptionEnd =
          matchingTransaction?.transactionInfo?.lineItems[0]?.expiryTime;
        let subscriptionData = {
          userId: token?.id,
          planId: data?.planId,
          startAt: data?.startAt,
          endAt: subscriptionEnd,
          providerId: data?.providerId,
          provider: data?.provider,
          amount: formattedPrice,
          notes: { itemId: item?._id },
          subscriptionStatus: EsubscriptionStatus.active,
          createdBy: token?.id,
          updatedBy: token?.id,
          metaData: matchingTransaction?.transactionInfo,
          transactionDetails: {
            transactionId: transactionId,
            authAmount: formattedPrice,
            transactionDate: matchingTransaction?.transactionInfo?.startTime,
            planId: bodyData?.planId,
          },
          externalId: transactionId,
          currencyCode: currencyCode,
          currencyId: currencyResponse?._id,
        };

        const createdSubscription = await this.subscriptionService.subscription(
          subscriptionData,
          token
        );
        // let item = await this.itemService.getItemDetail(
        //   createdSubscription?.notes?.itemId
        // );
        let userBody = {
          userId: createdSubscription?.userId,
          membership: item?.itemName,
          badge: item?.additionalDetail?.badge,
        };
        await this.helperService.updateUser(userBody);

        // let price =
        //   matchingTransaction?.transactionInfo?.lineItems?.[0]?.autoRenewingPlan
        //     ?.recurringPrice?.units;
        let conversionRateAmt = await this.helperService.getConversionRate(
          currencyCode,
          formattedPrice
        );
        let baseAmount = parseInt(
          (formattedPrice * conversionRateAmt).toString()
        );
        const invoiceData = {
          itemId: item?._id,
          source_id: createdSubscription?._id,
          source_type: "subscription",
          sub_total: formattedPrice,
          document_status: EDocumentStatus.active,
          grand_total: formattedPrice,
          user_id: token?.id,
          created_by: token?.id,
          updated_by: token?.id,
          currencyCode: currencyCode,
          currency: currencyResponse?._id,
        };
        // console.log("invoiceData",invoiceData);

        const invoice = await this.invoiceService.createInvoice(
          invoiceData,
          token.id
        );
        const paymentData = {
          amount: Number(formattedPrice),
          document_status: EDocumentStatus.completed,
          providerId: EProviderId.google,
          providerName: EProvider.google,
          metaData: {
            externalId: data?.metaData?.externalId,
            latestOrderId: matchingTransaction?.transactionInfo?.latestOrderId,
          },
          transactionDate: new Date(),
          currencyCode: currencyCode,
          currency: currencyResponse?._id,
          baseAmount: baseAmount.toFixed(2),
          baseCurrency: "INR",
          conversionRate: conversionRateAmt,
          paymentType: "Auth",
        };
        // console.log("paymentData",paymentData);

        let paymentDetails = await this.paymentService.createPaymentRecord(
          paymentData,
          token,
          invoice
        );
        let mandateData = {
          sourceId: createdSubscription?._id,
          userId: token?.id,
          paymentMethod: "ONLINE",
          amount: formattedPrice,
          providerId: EProviderId.google,
          currency: currencyCode,
          planId: data.planId,
          mandateStatus: EMandateStatus.active,
          status: EStatus.Active,
          metaData: data?.metaData,
          startDate: data?.startAt,
          endDate: bodyData?.mandateExpiryTime,
        };
        let mandate = await this.mandateService.addMandate(mandateData, token);
        await this.mandateHistoryService.createMandateHistory({
          mandateId: mandate?._id.toString(),
          mandateStatus: EMandateStatus.active,
          status: EStatus.Active,
          metaData: data.metaData,
          createdBy: token?.id,
          updatedBy: token?.id,
        });
        const subscriptionCount = await this.subscriptionService.countUserSubscriptions(token?.id);
        let mixPanelBody: any = {};
        mixPanelBody.eventName = EMixedPanelEvents.subscription_add;
        mixPanelBody.distinctId = token.id;
        mixPanelBody.properties = {
          user_id: token?.id,
          provider: EProvider.google,
          subscription_id: createdSubscription?._id,
          subscription_status: createdSubscription?.subscriptionStatus,
          subscription_date: createdSubscription?.startAt,
          item_name: item?.itemName,
          subscription_expired: createdSubscription?.endAt,
          subscription_count: subscriptionCount,
          subscription_mode: ESubscriptionMode.Auth,
          subscription_amount: formattedPrice
        };
        await this.helperService.mixPanel(mixPanelBody);
        let firstSubscription = await this.subscriptionService.userFirstSubscription(token?.id);
        let propertie = {
          first_subscription_date: firstSubscription?.startAt
        }
        await this.helperService.setUserProfile({ distinctId: token?.id,properties: propertie});
        let isFirstPayment = await this.paymentService.getFirstPaymentByUserId(token?.id);
        let finalResponse:any = createdSubscription.toObject()
        if (isFirstPayment && paymentDetails?._id.toString() === isFirstPayment?._id.toString()) {
          finalResponse = {
            ...createdSubscription.toObject(),
            isFirstPayment: true,
            paymentId: isFirstPayment?._id
          }
        }
        return finalResponse;
      }
      return existingSubscription;
    } catch (error) {
      throw error;
    }
  }
  // async init() {
  //   const encodedKey = await new Promise<string>((res, rej) => {
  //     readFile(filePath, (err, data) => {
  //       if (err) return rej(err);
  //       res(data.toString());
  //     });
  //   });
  //   // console.log("encodedKey", encodedKey);
  //   // console.log("client", encodedKey, keyId, issuerId, bundleId, environment);
  //   // google iap
  //   this.client = new AppStoreServerAPIClient(
  //     encodedKey,
  //     keyId,
  //     issuerId,
  //     bundleId,
  //     environment
  //   );
  // }
  async getTransactionHistoryById(originalTransactionId) {
    // Validate input parameter
    if (!originalTransactionId) {
      console.log("Error: originalTransactionId is required");
      return null;
    }

    console.log("Searching for transaction:", originalTransactionId);
    let encodedKey: string;
    try {
      encodedKey = await new Promise<string>((res, rej) => {
        readFile(filePath, (err, data) => {
          if (err) return rej(err);
          res(data.toString());
        });
      });
    } catch (err) {
      console.log("Error reading Apple private key file:", err);
      return null;
    }
    // Validate required environment variables
    if (!keyId || !issuerId || !bundleId) {
      console.log(
        "Error: Missing required environment variables (keyId, issuerId, bundleId)"
      );
      return null;
    }

    const prodClient = new AppStoreServerAPIClient(
      encodedKey,
      keyId,
      issuerId,
      bundleId,
      prodEnvironment
    );

    const sandboxClient = new AppStoreServerAPIClient(
      encodedKey,
      keyId,
      issuerId,
      bundleId,
      environment
    );
    const clients = [
      { name: "Production", client: prodClient },
      { name: "Sandbox", client: sandboxClient },
    ];

    for (const { name, client } of clients) {
      try {
        console.log(`Trying ${name} environment...`);

        let transactionId = originalTransactionId;
        // console.log("transactionId", transactionId);

        let response = null;
        let transactions: string[] = [];
        const transactionHistoryRequest = {
          sort: Order.ASCENDING,
          revoked: false,
          productTypes: [
            ProductType.AUTO_RENEWABLE,
            ProductType.NON_RENEWABLE,
            ProductType.CONSUMABLE,
          ],
        };
        try {
          do {
            const revisionToken = response?.revision ?? null;
            response = await client.getTransactionHistory(
              transactionId,
              revisionToken,
              transactionHistoryRequest,
              GetTransactionHistoryVersion.V2
            );
            if (response.signedTransactions) {
              transactions.push(...response.signedTransactions);
            }
          } while (response.hasMore);
        } catch (err) {
          console.log(`Error in ${name} environment:`, err);
          if (err.httpStatusCode === 404) {
            console.log(
              `Transaction ${transactionId} not found in ${name} environment`
            );
          }
          // Continue to next environment if this one fails
          continue;
        }

        // If no transactions were found, continue to next environment
        if (transactions.length === 0) {
          console.log(`No transactions found in ${name} environment`);
          continue;
        }

        console.log(
          `Found ${transactions.length} transactions in ${name} environment`
        );
        // do {
        //   const revisionToken = response?.revision ?? null;
        //   response = await client.getTransactionHistory(
        //     transactionId,
        //     revisionToken,
        //     transactionHistoryRequest,
        //     GetTransactionHistoryVersion.V2
        //   );
        //   if (response.signedTransactions) {
        //     transactions.push(...response.signedTransactions);
        //   }
        // } while (response.hasMore);

        const decodedTokens = await Promise.all(
          transactions.map((token) => this.parseJwt(token))
        );

        // Filter out any null results from failed JWT parsing
        const validDecodedTokens = decodedTokens.filter(
          (token) => token !== null
        );
        if (validDecodedTokens.length === 0) {
          console.log(`No valid JWT tokens found in ${name} environment`);
          continue;
        }

        console.log(
          `Successfully decoded ${validDecodedTokens.length} tokens in ${name} environment`
        );

        // console.log(
        //   "filter decode token",
        //   decodedTokens.find(
        //     (tx) =>
        //       tx.originalTransactionId === transactionId &&
        //       tx.transactionReason === "PURCHASE"
        //   )
        // );

        const purchaseMatch = validDecodedTokens.find(
          (tx) =>
            tx.originalTransactionId === transactionId &&
            tx.transactionReason === "PURCHASE"
        );

        if (purchaseMatch) {
          console.log(
            `✅ Transaction found in ${name} environment:`,
            purchaseMatch.transactionId
          );
          console.log("purchaseMatch", purchaseMatch);
          return purchaseMatch;
        }
      } catch (err) {
        console.log(`Error in ${name} environment:`, err);
        // Continue to next environment instead of throwing
        continue;
      }
    }

    // If we reach here, no transaction was found in any environment
    console.log("Transaction not found in any environment");
    return null;
  }

  async getTransactionHistory(bodyData) {
    try {
      // console.log("bodyData", bodyData);
      const purchaseInfo = await this.validatePurchase(
        bodyData?.data?.signedTransactionInfo
      );
      // console.log("purchaseInfo", JSON.stringify(purchaseInfo));
      if (bodyData.notificationType === EEventType.didPurchase) {
        let signedRenewalInfo = await this.parseJwt(
          bodyData?.data?.signedRenewalInfo
        );
        // console.log("signedRenewalInfo", signedRenewalInfo);
        const price = purchaseInfo?.parsed?.price;
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
        const renewalPrice = signedRenewalInfo?.renewalPrice;
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
      } else if (
        bodyData.notificationType === EEventType.didChangeRenewalStatus &&
        bodyData.subtype === EEventType.autoRenewDisabled
      ) {
        let signedRenewalInfo = await this.parseJwt(
          bodyData?.data?.signedRenewalInfo
        );
        // console.log("signedRenewalInfo", signedRenewalInfo);

        const price = purchaseInfo?.parsed?.price;
        let transactionDetails = {
          transactionId: purchaseInfo?.parsed?.transactionId,
          originalTransactionId: purchaseInfo?.parsed?.originalTransactionId,
          webOrderLineItemId: purchaseInfo?.parsed?.webOrderLineItemId,
          bundleId: purchaseInfo?.parsed?.bundleId,
          productId: purchaseInfo?.parsed?.productId,
          // revocationReason: purchaseInfo?.parsed?.revocationReason,
          subscriptionGroupIdentifier:
            purchaseInfo?.parsed?.subscriptionGroupIdentifier,
          originalPurchaseDate: new Date(
            purchaseInfo?.parsed?.originalPurchaseDate
          ).toISOString(),
          purchaseDate: new Date(
            purchaseInfo?.parsed?.purchaseDate
          ).toISOString(),
          // revocationDate: new Date(
          //   purchaseInfo?.parsed?.revocationDate
          // ).toISOString(),
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
          // appAccountToken: purchaseInfo?.parsed?.appAccountToken,
          // isUpgraded: purchaseInfo?.parsed?.isUpgraded,
        };
        // const renewalPrice = signedRenewalInfo?.renewalPrice;
        // console.log("renewalPrice",renewalPrice.toFixed(2));
        const renewalDetails = {
          originalTransactionId: signedRenewalInfo?.originalTransactionId,
          autoRenewProductId: signedRenewalInfo?.autoRenewProductId,
          productId: signedRenewalInfo?.productId,
          autoRenewStatus: signedRenewalInfo?.autoRenewStatus,
          // renewalPrice: renewalPrice,
          // currency: signedRenewalInfo?.currency,
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
        const price = purchaseInfo?.parsed?.price;
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
        const renewalPrice = signedRenewalInfo?.renewalPrice;
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
        const renewalPrice = purchaseInfo?.parsed?.price;
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
      // console.log("json payload", JSON.stringify(jsonPayload));
      return JSON.parse(jsonPayload);
    } catch (err) {
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
      throw error;
    }
  }
  // google iap
  async googleRtdn(payload) {
    try {
      console.log("payload", payload);
      const pubSubMessage = payload?.message;
      if (pubSubMessage) {        
      const messageBuffer = Buffer.from(pubSubMessage.data, "base64");
      const notification = JSON.parse(messageBuffer.toString());
      console.log("notification", notification);

      const { subscriptionNotification } = notification;
      if (notification.subscriptionNotification) { 
      const { notificationType, purchaseToken } = subscriptionNotification;
      // console.log("notificationType", purchaseToken, notification.packageName);

      const verification = await this.validateTransactions(
        notification.packageName,
        purchaseToken
      );
      // console.log("verification", verification);

      let verificationData = {
        ...verification,
        purchaseToken: purchaseToken,
        notificationType: notificationType,
      };
      return verificationData;        
    }
  }
    } catch (err) {
      throw err;
    }
  }

  async validateTransactions(packageName, data) {
    try {
      // console.log("packageName", packageName, data);
      const auth = new google.auth.GoogleAuth({
        keyFile: googleFile,
        scopes: [scopes],
      });
      // console.log("auth", auth);
      this.androidpublisher = google.androidpublisher({
        version: "v3",
        auth: auth,
      });
      const res = await this.androidpublisher.purchases.subscriptionsv2.get({
        packageName: packageName,
        token: data,
      });
      // console.log("res", res);
      const transactionInfo = res.data;
      console.log("transactionInfo", transactionInfo);

      return {
        success: res.data.expiryTime > new Date(),
        transactionInfo,
      };
    } catch (err) {
      // console.log("err", err);

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
      let existingSubscription = await this.subscriptionService.getSubscriptionByUserId( token.id)
      let startAt: Date;
      let endAt: Date;

      if (existingSubscription) {
        let itemdetail = await this.itemService.getItemDetail(bodyData?.itemId)
        startAt = new Date(new Date(existingSubscription.endAt).getTime() + 2000);
        let subscriptionData = await this.subscriptionService.validateSubscription(token.id, [
          EsubscriptionStatus.initiated,
          EsubscriptionStatus.failed,
        ]);

        startAt = new Date(new Date(existingSubscription?.endAt).getTime() + 2000);

        let endAtValidity = bodyData?.refId || subscriptionData ? itemdetail?.additionalDetail?.promotionDetails?.subscriptionDetail?.validity : itemdetail?.additionalDetail?.promotionDetails?.authDetail?.validity
        let endAtValidityType = bodyData?.refId || subscriptionData ? itemdetail?.additionalDetail?.promotionDetails?.subscriptionDetail?.validityType : itemdetail?.additionalDetail?.promotionDetails?.authDetail?.validityType
        endAt = new Date(startAt);
        if (endAtValidityType === 'day') {
          endAt.setDate(endAt.getDate() + endAtValidity);
        } else if (endAtValidityType === 'month') {
          endAt.setMonth(endAt.getMonth() + endAtValidity);
        } else if (endAtValidityType === 'year') {
          endAt.setFullYear(endAt.getFullYear() + endAtValidity);
        }
        endAt.setUTCHours(18, 29, 59, 999);
        
      } else {
        startAt = new Date();
        let endDate = new Date(data?.firstCharge);
        endDate.setUTCHours(18, 29, 59, 999);
        endAt = endDate;
      }

      const subscriptionData = {
        userId: token.id,
        subscriptionId: data?.subscription_id,
        startAt: startAt.toISOString(),
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
        mandateId: mandate?._id.toString(),
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
      const invoice = await this.invoiceService.createInvoice(
        invoiceData,
        token.id
      );

      const paymentData = {
        amount: data.authAmount,
        currencyCode: data.currency,
        document_status: EDocumentStatus.pending,
        paymentType: EPaymentType.auth,
        providerId: 1,
        providerName: EProvider.razorpay,
      };
      let payment = await this.paymentService.createPaymentRecord(
        paymentData,
        token,
        invoice,
        data?.currencyCode,
        { order_id: subscription.id }
      );
      // console.log("returning data");

      return {
        subscriptionDetails: {
          customerId: customerId,
          ...subscription,
          paymentId: payment?.id,
        },
      };
    } catch (err) {
      throw err;
    }
  }
  async handleIapCoinPurchase(body, token) {
    try {
      let transactionId =
        body.providerName === EProvider.apple
          ? body.transactionDetails.originalTransactionId || body.transactionDetails.transactionId
          : body.transactionDetails.transactionId;
  
      const lockKey = `${body.providerName}_transaction_${transactionId}`;
      const { acquired, value: lockValue } = await this.redisService.acquireLock(lockKey, undefined, 30);

      if (!acquired) {
        const providerId = body.providerName === EProvider.apple ? EProviderId.apple : EProviderId.google;
      
        const maxWaitMs = 3000;   
        const intervalMs = 500;   
      
        for (let waited = 0; waited < maxWaitMs; waited += intervalMs) {
          await new Promise(res => setTimeout(res, intervalMs));
      
          const existingPayment = await this.paymentService.getPaymentByExternalId(transactionId, providerId);
          if (existingPayment) {
            return { paymentResponse: existingPayment };
          }
        }
      
        return { paymentResponse: null, message: `Transaction is being processed by another request` };
      }
      
      try {
        let transaction;
        if (body.providerName === EProvider.apple) {
          transaction = await this.getTransactionHistoryById(transactionId);
        } else {
          const googlePackage = packageName;
          transaction = await this.validatePurchaseState(
            googlePackage,
            transactionId,
            body.transactionDetails.planId
          );
        }
  
        let existingPayment = await this.paymentService.getPaymentByExternalId(
          transactionId,
          body.providerName === EProvider.apple ? EProviderId.apple : EProviderId.google
        );
        if (existingPayment) return { paymentResponse: existingPayment };
  
        const price = transaction?.amount ?? transaction?.price / 1000;
        const currencyCode = transaction?.currency;
        const currencyIdRes = await this.helperService.getCurrencyId(currencyCode);
        const currencyResponse = currencyIdRes?.data?.[0];
        const provider = body.providerName === EProvider.apple ? EProviderId.apple : EProviderId.google;
        const item = await this.itemService.getItemByPlanConfig(body?.transactionDetails?.planId, provider);
  
        const invoiceData = {
          itemId: item._id,
          source_type: EPaymentSourceType.coinTransaction,
          sub_total: price,
          document_status: EDocumentStatus.completed,
          grand_total: price,
          user_id: token.id,
          created_by: token.id,
          updated_by: token.id,
          currencyCode: currencyResponse.currency_code,
          currency: currencyResponse._id,
        };
        const invoice = await this.invoiceService.createInvoice(invoiceData, token.id);
        const conversionRateAmt = await this.helperService.getConversionRate(currencyCode, price);
        const baseAmount = Math.round(price * conversionRateAmt);
  
        const paymentData = {
          amount: price,
          document_status: EDocumentStatus.completed,
          providerId: provider,
          providerName: body.providerName,
          transactionDate: new Date(),
          metaData: { externalId: transactionId, transaction },
          currencyCode: currencyResponse.currency_code,
          currencyId: currencyResponse._id,
          baseAmount,
          baseCurrency: currencyCode,
          conversionRate: conversionRateAmt,
        };
  
        const paymentResponse = await this.paymentService.createPaymentRecord(paymentData, token, invoice);
  
        const payload = {
          userId: token.id,
          coinValue: item?.additionalDetail?.coinValue,
          sourceId: invoice?._id,
          sourceType: EDocumentTypeName.invoice,
        };
        const createCoinValue = await this.paymentService.createCoinValue(payload);
  
        const updatedInvoice = await this.invoiceService.updateSalseDocumentById({
          _id: new ObjectId(invoice?._id),
          sourceId: new ObjectId(createCoinValue),
        });
        let isFirstPayment = await this.paymentService.getFirstPaymentByUserId(token?.id);
        let finalResponse:any = paymentResponse.toObject()
        if (isFirstPayment && paymentResponse?._id.toString() === isFirstPayment?._id.toString()) {
          finalResponse = {
            ...paymentResponse.toObject(),
            isFirstPayment: true,
            paymentId: isFirstPayment?._id
          }
        }
        return { paymentResponse: finalResponse, updatedInvoice };
      } finally {
        await this.redisService.releaseLock(lockKey, lockValue);
      }
    } catch (error) {
      console.error('[handleIapCoinPurchase Error]', error);
      throw error;
    }
  }
  async validatePurchaseState(
    packageName: string,
    purchaseToken: string,
    productId: string
  ) {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: googleFile,
        scopes: [scopes],
      });

      this.androidpublisher = google.androidpublisher({
        version: "v3",
        auth,
      });

      // 🔹 Step 1: Verify the purchase state
      const res = await this.androidpublisher.purchases.products.get({
        packageName,
        productId,
        token: purchaseToken,
      });
      const purchaseInfo = res.data;

      // 🔹 Step 2: Get product details (pricing info)
      let productPriceInfo = null;
      let amount: number | null = null;
      let currency: string | null = null;

      try {
        const productRes = await this.androidpublisher.inappproducts.get({
          packageName,
          sku: productId,
        });
        productPriceInfo = productRes.data;

        const regionCode = purchaseInfo?.regionCode;
        if (productPriceInfo?.prices?.[regionCode]) {
          amount = Number(productPriceInfo.prices[regionCode].priceMicros) / 1_000_000;
          currency = productPriceInfo.prices[regionCode].currency;
        } 
      } catch (priceErr) {
        console.error("Error fetching product price info:", priceErr);
      }
      return {
        success: true,
        purchaseInfo,
        productPriceInfo,
        amount,
        currency,
        purchaseState: purchaseInfo.purchaseState,
        consumptionState: purchaseInfo.consumptionState,
        orderId: purchaseInfo.orderId,
        purchaseTimeMillis: purchaseInfo.purchaseTimeMillis,
        acknowledgementState: purchaseInfo.acknowledgementState,
      };
    } catch (err) {
      console.error("purchase state validation err", err);
      throw err;
    }
  }
}
