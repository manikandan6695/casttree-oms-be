import { ESourceType } from "src/service-request/enum/service-request.enum";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { HelperService } from "src/helper/helper.service";
import { EDocumentStatus } from "src/invoice/enum/document-status.enum";
import { InvoiceService } from "src/invoice/invoice.service";
import { EMandateStatus } from "src/mandates/enum/mandate.enum";
import { MandateHistoryService } from "src/mandates/mandate-history/mandate-history.service";
import {
  EPaymentSourceType,
  EPaymentType,
} from "src/payment/enum/payment.enum";
import { PaymentRequestService } from "src/payment/payment-request.service";
import { EStatus } from "src/shared/enum/privacy.enum";
import { SharedService } from "src/shared/shared.service";
import { MandatesService } from "../mandates/mandates.service";
import { EsubscriptionStatus } from "./../process/enums/process.enum";
import { EProvider, EProviderId } from "./enums/provider.enum";
import { SubscriptionProvider } from "./subscription.interface";
import { SubscriptionService } from "./subscription.service";
import {
  AppStoreServerAPIClient,
  Environment,
  GetTransactionHistoryVersion,
  Order,
  ProductType,
} from "@apple/app-store-server-library";
import { readFile } from "fs";
import { ITransactionHistoryResponse } from "./dto/subscription.dto";
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
  async onModuleInit() {
    await this.init();
  }

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

    const existingSubscription =
      await this.subscriptionService.findExternalId(transactionId);
    if (existingSubscription) {
      console.log("existing subscription", existingSubscription);

      return existingSubscription;
    }

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
    };

    const createdSubscription = await this.subscriptionService.subscription(
      subscriptionData,
      token
    );

    const invoiceData = {
      itemId: data.itemId,
      source_id: createdSubscription._id,
      source_type: "subscription",
      sub_total: data.authAmount,
      document_status: EDocumentStatus.pending,
      grand_total: data.authAmount,
      user_id: token.id,
      created_by: token.id,
      updated_by: token.id,
    };

    const invoice = await this.invoiceService.createInvoice(invoiceData);

    const paymentData = {
      amount: data.authAmount,
      document_status: EDocumentStatus.pending,
      providerId: EProviderId.apple,
      providerName: EProvider.apple,
      transactionDate: new Date(),
    };

    await this.paymentService.createPaymentRecord(paymentData, token, invoice);

    return createdSubscription;
  }

  private async hanldeGoogleIAPSubscription(data, bodyData, token: UserToken) {
    const transactionId = bodyData.transactionDetails?.externalId;

    const existingSubscription =
      await this.subscriptionService.findExternalId(transactionId);
    if (existingSubscription) {
      console.log("existing subscription", existingSubscription);

      return existingSubscription;
    }

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
    };

    const createdSubscription = await this.subscriptionService.subscription(
      subscriptionData,
      token
    );

    const invoiceData = {
      itemId: data.itemId,
      source_id: createdSubscription._id,
      source_type: "subscription",
      sub_total: data.authAmount,
      document_status: EDocumentStatus.pending,
      grand_total: data.authAmount,
      user_id: token.id,
      created_by: token.id,
      updated_by: token.id,
    };

    const invoice = await this.invoiceService.createInvoice(invoiceData);

    const paymentData = {
      amount: data.authAmount,
      document_status: EDocumentStatus.pending,
      providerId: EProviderId.google,
      providerName: EProvider.google,
    };

    await this.paymentService.createPaymentRecord(paymentData, token, invoice);

    return createdSubscription;
  }

  //   private async init() {
  //  try {
  //   const encodedKey = await new Promise<string>((res, rej) => {
  //     readFile(filePath, (err, data) => {
  //       if (err) return rej(err);
  //       res(data.toString());
  //     });
  //   });
  //   console.log("encodedKey",encodedKey);
  //   console.log("env",issuerId,keyId,bundleId,filePath,environment)
  // this.client = new AppStoreServerAPIClient(
  //   encodedKey,
  //   keyId,
  //   issuerId,
  //   bundleId,
  //   environment
  // );
  // const transactionId = "2000000889069745";
  // if (transactionId != null) {
  //   const transactionHistoryRequest = {
  //     sort: Order.ASCENDING,
  //     revoked: false,
  //     productTypes: [ProductType.AUTO_RENEWABLE],
  //   };
  //   let response = null;
  //   let transactions = [];
  //   do {
  //     const revisionToken =
  //       response !== null && response.revision !== null
  //         ? response.revision
  //         : null;
  //     response = await this.client.getTransactionHistory(
  //       transactionId,
  //       revisionToken,
  //       transactionHistoryRequest,
  //       GetTransactionHistoryVersion.V2
  //     );
  //     console.log("response is", response)
  //     if (response.signedTransactions) {
  //       transactions = transactions.concat(response.signedTransactions);
  //     }
  //   } while (response.hasMore);
  //   console.log(transactions);
  // }
  //  } catch (error) {
  //   console.log(error);
  //   throw error

  //  }

  //   }

  // async getTransactionHistory(bodyData) {
  //   // const request = {
  //   //   sort: Order.ASCENDING,
  //   //   revoked: false,
  //   //   productTypes: [ProductType.AUTO_RENEWABLE],
  //   // };
  //   //  let transactionId = "2000000888157489";

  // //  let transactionData= await this.client.getTransactionInfo(transactionId);
  // //  console.log("transactionData",transactionData);
  //   const validatePurchase = await this.validatePurchase(bodyData.data.signedTransactionInfo);
  // console.log("validatePurchase", validatePurchase);
  // const signedRenewalInfo = await this.validatePurchase(bodyData.data.signedRenewalInfo)
  // console.log("signedRenewalInfo", signedRenewalInfo);

  // if (validatePurchase) {
  //   let activeTransaction= validatePurchase?.parsed?.expiresDate
  //   let active = activeTransaction==new Date(activeTransaction).getTime() > Date.now()
  //   console.log("activeTransaction",activeTransaction,active);
  // }
  // // const activeTransaction = validatePurchase.map((t) => {
  // //       return t.expirationDate && new Date(t.expirationDate).getTime() > Date.now();
  // //     });
  // //     console.log("activeTransaction",activeTransaction);

  //   // const transactions = [];
  //   // let response = null;
  //   // let revision = undefined;
  //   // let transactionId = validatePurchase?.parsed?.originalTransactionId;

  //   // do {
  //   //   response = await this.client.getTransactionHistory(
  //   //     transactionId,
  //   //     revision,
  //   //     request,
  //   //     GetTransactionHistoryVersion.V2
  //   //   );

  //   //   transactions.push(...(response.signedTransactions || []));
  //   //   revision = response.revision;
  //   //   console.log("response", response);
  //   // } while (response.hasMore);

  //   return validatePurchase;
  // }
  // async getTransactionHistory(bodyData) {
  //   try {

  //     const validatePurchase = await this.validatePurchase(bodyData.data.signedTransactionInfo);
  //     console.log("validatePurchase", validatePurchase);

  //     const signedRenewalInfo = await this.validatePurchase(bodyData.data.signedRenewalInfo);
  //     console.log("signedRenewalInfo", signedRenewalInfo);

  //     if (!validatePurchase?.parsed) {
  //       return {
  //         success: false,
  //         message: "Invalid transaction data",
  //       };
  //     }

  //     const active = validatePurchase.parsed.expiresDate > Date.now();

  //     return {
  //       success: validatePurchase.success,
  //       isActive: active,
  //       productId: validatePurchase.parsed.productId,
  //       originalTransactionId: validatePurchase.parsed.originalTransactionId,
  //       purchaseDate: validatePurchase.parsed.purchaseDate,
  //       expiresDate: validatePurchase.parsed.expiresDate,
  //       renewalDate: signedRenewalInfo?.parsed?.renewalDate,
  //       rawTransaction: validatePurchase.parsed,
  //       rawRenewal: signedRenewalInfo?.parsed,
  //     };
  //   } catch (err) {
  //     console.log("Error in getTransactionHistory", err);
  //     throw err
  //   }
  // }
  async init() {
    const encodedKey = await new Promise<string>((res, rej) => {
      readFile(filePath, (err, data) => {
        if (err) return rej(err);
        res(data.toString());
      });
    });

    console.log("encodedKey", encodedKey);
    console.log("env", issuerId, keyId, bundleId, filePath, environment);

    this.client = new AppStoreServerAPIClient(
      encodedKey,
      keyId,
      issuerId,
      bundleId,
      environment
    );

    const transactionId = "2000000890594891";

    if (transactionId != null) {
      try {
        const info = await this.client.getTransactionInfo(transactionId);
        console.log("Transaction Info:", info);
      } catch (err) {
        console.error("Error fetching transaction info:", err);
      }

      const transactionHistoryRequest = {
        sort: Order.ASCENDING,
        revoked: false,
        productTypes: [ProductType.AUTO_RENEWABLE],
      };

      let response = null;
      let transactions = [];

      do {
        const revisionToken = response?.revision ?? null;
        response = await this.client.getTransactionHistory(
          transactionId,
          revisionToken,
          transactionHistoryRequest,
          GetTransactionHistoryVersion.V2
        );
        console.log("response is", response);
        if (response.signedTransactions) {
          transactions = transactions.concat(response.signedTransactions);
        }
      } while (response.hasMore);

      console.log(transactions);
    }
  }

  async getTransactionHistory(bodyData) {
    try {
      const validatePurchase = await this.validatePurchase(
        bodyData.data.signedTransactionInfo
      );
      const signedRenewalInfo = await this.validatePurchase(
        bodyData.data.signedRenewalInfo
      );

      if (!validatePurchase?.parsed) {
        return {
          success: false,
          message: "Invalid transaction data",
        };
      }

      const active = validatePurchase.parsed.expiresDate > Date.now();

      return {
        success: validatePurchase.success,
        isActive: active,
        productId: validatePurchase.parsed.productId,
        originalTransactionId: validatePurchase.parsed.originalTransactionId,
        transactionId: validatePurchase.parsed.transactionId,
        purchaseDate: validatePurchase.parsed.purchaseDate,
        expiresDate: validatePurchase.parsed.expiresDate,
        renewalDate: signedRenewalInfo?.parsed?.renewalDate,
        rawTransaction: validatePurchase.parsed,
        rawRenewal: signedRenewalInfo?.parsed,
      };
    } catch (err) {
      console.log("Error in getTransactionHistory", err);
      throw err;
    }
  }

  parseJwt(token) {
    // console.log("iap ids", issuerId, keyId, bundleId, filePath, environment);

    try {
      const base64Url = token.split(".")[1];

      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );

      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error("Error while parsing JWT:", err, token);
      return null;
    }
  }

  async validatePurchase(signedTransactionInfo) {
    try {
      const parsed = this.parseJwt(signedTransactionInfo);
      // let data= await this.client.getTransactionInfo("2000000890594891");
      //     console.log("signedTransactionInfo", data);
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

  // async validatePurchase(signedTransactionInfo) {
  //  try {
  //   // console.log("inside validatePurchase", signedTransactionInfo);

  //     let data= await this.client.getTransactionInfo("2000000890594891");
  //     console.log("signedTransactionInfo", data);
  //   const parsed = this.parseJwt(signedTransactionInfo);
  //   console.log("parsed", parsed);

  //   if (!parsed) {
  //     return {
  //       status: 'error',
  //       message: 'Failed to parse or decode JWT.',
  //     };
  //   }
  //   return {
  //     success: parsed.expiresDate > Date.now(),
  //     parsed,
  //   };

  //  } catch (error) {
  //   console.log("error in validatePurchase", error);
  //   throw error
  //  }
  // }
}
