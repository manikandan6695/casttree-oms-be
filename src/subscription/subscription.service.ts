import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Req,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import { Model } from "mongoose";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { EMixedPanelEvents } from "src/helper/enums/mixedPanel.enums";
import { HelperService } from "src/helper/helper.service";
import { EDocumentStatus } from "src/invoice/enum/document-status.enum";
import { InvoiceService } from "src/invoice/invoice.service";
import { Estatus } from "src/item/enum/status.enum";
import { ItemService } from "src/item/item.service";
import { EMandateStatus } from "src/mandates/enum/mandate.enum";
import { MandateHistoryService } from "src/mandates/mandate-history/mandate-history.service";
import { MandatesService } from "src/mandates/mandates.service";
import {
  ECoinStatus,
  ECoinTransactionTypes,
  ECurrencyName,
  EPaymentSourceType,
  EPaymentStatus,
  EPaymentType,
  ETransactionType,
} from "src/payment/enum/payment.enum";
import { PaymentRequestService } from "src/payment/payment-request.service";
import { EStatus } from "src/shared/enum/privacy.enum";
import { SharedService } from "src/shared/shared.service";
import {
  CancelSubscriptionBody,
  CashfreeFailedPaymentPayload,
  CashfreeNewPaymentPayload,
  CreateSubscriptionDTO,
  PaymentRecordData,
  SubscriptionData,
  UpdatePaymentBody,
  UserUpdateData,
} from "./dto/subscription.dto";
import { EEventId, EEventType, EReferralStatus } from "./enums/eventType.enum";
import { EErrorHandler, EProvider, EProviderId, ESProviderId, ESubscriptionMode } from "./enums/provider.enum";
import { EsubscriptionStatus } from "./enums/subscriptionStatus.enum";
import { EvalidityType } from "./enums/validityType.enum";
import { ISubscriptionModel } from "./schema/subscription.schema";
import { SubscriptionFactory } from "./subscription.factory";
import { ServiceItemService } from "src/item/service-item.service";
import {
  ELIGIBLE_SUBSCRIPTION,
  NOT_ELIGIBLE_SUBSCRIPTION,
  SUBSCRIPTION_NOT_FOUND,
  EVENT_UPDATE_REFERRAL_STATUS
} from "src/shared/app.constants";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { ECommandProcessingStatus } from "src/shared/enum/command-source.enum";
import { ICoinTransaction } from "src/payment/schema/coinPurchase.schema";
import { CurrencyService } from "src/shared/currency/currency.service";
import { RedisService } from "src/redis/redis.service";
// var ObjectId = require("mongodb").ObjectID;
const { ObjectId } = require("mongodb");

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel("subscription")
    private readonly subscriptionModel: Model<ISubscriptionModel>,
    private readonly subscriptionFactory: SubscriptionFactory,
    private invoiceService: InvoiceService,
    @Inject(forwardRef(() => PaymentRequestService))
    private paymentService: PaymentRequestService,
    @Inject(forwardRef(() => HelperService))
    private helperService: HelperService,
    private sharedService: SharedService,
    private itemService: ItemService,
    @Inject(forwardRef(() => ServiceItemService))
    private serviceItemService: ServiceItemService,
    private readonly mandateService: MandatesService,
    private readonly mandateHistoryService: MandateHistoryService,
    private readonly eventEmitter: EventEmitter2,
    @InjectModel("coinTransaction")
    private readonly coinTransactionModel: Model<ICoinTransaction>,
    private currencyService: CurrencyService,
    private readonly redisService: RedisService,
  ) {}

  async createSubscription(body: CreateSubscriptionDTO, token) {
    try {
      // console.log("subscription creation body is ==>", body, body.provider);
      let subscriptionData;
      let mandateExpiryTime = this.sharedService.getFutureYearISO(5);
      switch (body.provider) {
        case "razorpay":
          let item = await this.itemService.getItemDetail(body.itemId);
          let existingSubscription = await this.validateSubscription(token.id, [
            EsubscriptionStatus.initiated,
            EsubscriptionStatus.failed,
          ]);

          let authAmount =
            body?.refId ||
            existingSubscription ||
            item?.additionalDetail?.promotionDetails?.authDetail?.amount == 0
              ? item?.additionalDetail?.promotionDetails?.subscriptionDetail
                  ?.amount
              : item?.additionalDetail?.promotionDetails?.authDetail?.amount;
          // console.log("auth amount is", authAmount);

          let expiry = Math.floor(
            new Date(this.sharedService.getFutureYearISO(10)).getTime() / 1000
          );
          const razorpaySubscriptionSequence =
            await this.sharedService.getNextNumber(
              "razorpay-subscription",
              "RZP-SUB",
              5,
              null
            );
          const razorpaySubscriptionNumber = razorpaySubscriptionSequence
            .toString()
            .padStart(5, "0");
          // console.log("inside subscription service", subscriptionNumber);
          let expiryDate = this.sharedService.getFutureYearISO(10);
          let detail =
            body?.refId || existingSubscription
              ? item?.additionalDetail?.promotionDetails?.subscriptionDetail
              : item?.additionalDetail?.promotionDetails?.authDetail;
          let chargeDate = await this.getFutureDate(detail);
          // console.log("chargeDate", chargeDate);
          let razorpaySubscriptionNewNumber = `${razorpaySubscriptionNumber}-${Date.now()}`;
          subscriptionData = {
            subscription_id: razorpaySubscriptionNewNumber.toString(),
            amount: authAmount * 100,
            authAmount: authAmount,
            currency:
              item?.additionalDetail?.promotionDetails?.authDetail
                ?.currency_code,
            method: "upi",
            subscriptionAmount:
              item?.additionalDetail?.promotionDetails?.subscriptionDetail
                ?.amount,
            maximumAmount:
              item?.additionalDetail?.promotionDetails?.subscriptionDetail
                ?.amount,
            token: {
              max_amount:
                item?.additionalDetail?.promotionDetails?.subscriptionDetail
                  ?.amount * 100,
              expire_at: expiry,
            },
            itemId: body?.itemId,
            firstCharge: chargeDate,
            expiryTime: expiryDate,
          };
          break;

        case "cashfree":
          let planData = await this.helperService.getPlanDetails(body.planId);
          const subscriptionSequence = await this.sharedService.getNextNumber(
            "cashfree-subscription",
            "CSH-SUB",
            5,
            null
          );
          const subscriptionNumber = subscriptionSequence
            .toString()
            .padStart(5, "0");
          // console.log("inside subscription service", subscriptionNumber);
          let expiryTime = this.sharedService.getFutureYearISO(5);
          let firstCharge =
            body.validityType === "day"
              ? this.sharedService.getFutureDateISO(body.validity)
              : body.validityType === "month"
                ? this.sharedService.getFutureMonthISO(body.validity)
                : body.validityType === "year"
                  ? this.sharedService.getFutureYearISO(body.validity)
                  : null;
          let subscriptionNewNumber = `${subscriptionNumber}-${Date.now()}`;
          body["expiryTime"] = expiryTime;
          body["firstCharge"] = firstCharge;
          subscriptionData = {
            subscription_id: subscriptionNewNumber.toString(),
            customer_details: {
              customer_name: token.userName,
              customer_email: token.phoneNumber + "@casttree.com",
              customer_phone: token.phoneNumber,
            },
            plan_details: {
              plan_name: planData?.plan_name,
              plan_id: planData?.plan_id,
              plan_type: planData?.plan_type,
              plan_amount: planData?.plan_max_amount,
              plan_max_amount: planData?.plan_max_amount,
              plan_max_cycles: planData?.plan_max_cycles,
              plan_intervals: planData?.plan_intervals,
              plan_interval_type: planData?.plan_interval_type,
              plan_currency: planData?.plan_currency,
            },
            authorization_details: {
              authorization_amount: body.authAmount == 0 ? 1 : body.authAmount,
              authorization_amount_refund: body.authAmount == 0 ? true : false,
              payment_methods: ["upi"],
            },
            subscription_meta: {
              return_url: body.redirectionUrl,
            },
            subscription_expiry_time: expiryTime,
            subscription_first_charge_time: firstCharge,
          };
          break;
        case EProvider.apple:
          body["mandateExpiryTime"] = mandateExpiryTime;
          subscriptionData = {
            userId: token?.id,
            planId: body?.planId,
            providerId: EProviderId.apple,
            provider: EProvider.apple,
            startAt: new Date(),
            subscriptionStatus: EsubscriptionStatus.active,
            notes: { itemId: body?.itemId },
            amount: body?.authAmount,
            status: EStatus.Active,
            createdBy: token?.id,
            updatedBy: token?.id,
            transactionDetails: body?.transactionDetails,
            metaData: {
              externalId: body?.transactionDetails?.originalTransactionId,
            },
          };
          break;
        case EProvider.google:
          body["mandateExpiryTime"] = mandateExpiryTime;
          subscriptionData = {
            userId: token?.id,
            planId: body?.planId,
            providerId: EProviderId.google,
            provider: EProvider.google,
            startAt: new Date(),
            subscriptionStatus: EsubscriptionStatus.active,
            notes: { itemId: body?.itemId },
            amount: body?.authAmount,
            status: EStatus.Active,
            createdBy: token?.id,
            updatedBy: token?.id,
            metaData: {
              externalId: body?.transactionDetails?.transactionId,
            },
          };
          break;
        default:
          throw new Error(`Unsupported provider: ${body.provider}`);
      }
      // console.log("formed subscription data", subscriptionData, body);

      const provider = this.subscriptionFactory.getProvider(body.provider);
      const data = await provider.createSubscription(
        subscriptionData,
        body,
        token
      );

      return { data };
    } catch (err) {
      throw err;
    }
  }

  async getFutureDate(detail: any) {
    switch (detail?.validityType) {
      case "day":
        return this.sharedService.getFutureDateISO(detail?.validity);
      case "month":
        return this.sharedService.getFutureMonthISO(detail?.validity);
      case "year":
        return this.sharedService.getFutureYearISO(detail?.validity);
      default:
        return null;
    }
  }
  async subscriptionWebhook(@Req() req, providerId: number) {
    try {
      // console.log(providerId);
      const getProviderName = (id: number) => {
        const map = {
          [EProviderId.razorpay]: EProvider.razorpay,
          [EProviderId.cashfree]: EProvider.cashfree,
          [EProviderId.apple]: EProvider.apple,
          [EProviderId.google]: EProvider.google,
        };
        return map[id];
      };
      const provider = getProviderName(providerId);
      console.log("provider:", provider);
      // console.log("provider", provider);
      if (provider === EProvider.razorpay) {
        let event = req?.body?.event;
        console.log("event name", event);
        if (event === EEventType.paymentAuthorized) {
          const payload = req?.body?.payload;
          console.log("payload", payload);
          await this.handleRazorpaySubscriptionPayment(payload);
          // await this.handleRazorpaySubscription(payload);
        }
        // if (event === EEventType.tokenConfirmed) {
        //   const payload = req?.body?.payload;
        //   await this.handleRazorpayMandate(payload);
        //   // await this.handleRazorpaySubscription(payload);
        // }
        if (event === EEventType.paymentFailed) {
          const payload = req?.body?.payload;
          await this.handleRazorpayFailedPayment(payload);
          // await this.handleRazorpaySubscription(payload);
        }

        if (event === EEventType.tokenCancelled) {
          const payload = req?.body?.payload;
          await this.handleRazorpayCancelledMandate(payload);
          // await this.handleRazorpaySubscription(payload);
        }

        if (event === EEventType.tokenCancel) {
          const payload = req?.body?.payload;
          await this.handleRazorpayCancelMandate(payload);
          // await this.handleRazorpaySubscription(payload);
        }

        if (event === EEventType.tokenPaused) {
          const payload = req?.body?.payload;
          await this.handleRazorpayPausedMandate(payload);
          // await this.handleRazorpaySubscription(payload);
        }

        if (event === EEventType.tokenRejected) {
          const payload = req?.body?.payload;
          await this.handleRazorpayRejectedMandate(payload);
          // await this.handleRazorpaySubscription(payload);
        }

        if (event === EEventType.paymentRefunded) {
          const payload = req?.body?.payload;
          await this.handleRazorpayRefund(payload);
        }
        // await this.handleRazorpaySubscription(req.body.payload);
      } else if (provider === EProvider.cashfree) {
        const eventType = req.body?.type;
        if (eventType === "SUBSCRIPTION_STATUS_CHANGED") {
          await this.handleCashfreeStatusChange(req.body);
        } else if (eventType === "SUBSCRIPTION_PAYMENT_SUCCESS") {
          await this.handleCashfreeNewPayment(req.body);
        } else if (eventType === "SUBSCRIPTION_PAYMENT_FAILED") {
          // console.log("provider", "failed");
          await this.handleCashfreeFailedPayment(req.body);
        }
      } else if (provider == EProvider.apple) {
        const decodeId = await this.subscriptionFactory.parseJwt(
          req?.body?.signedPayload
        );
        if (
          decodeId?.notificationType === EEventType.didRenew ||
          decodeId?.subtype === EEventType.subTypeRenew
        ) {
          await this.handleAppleIAPRenew(decodeId);
        } else if (
          req?.body?.decodeId &&
          req.body.decodeId?.notificationType ===
            EEventType.didChangeRenewalStatus
        ) {
          if (req.body.decodeId?.subtype === EEventType.autoRenewDisabled) {
            let body = req.body.decodeId;
            await this.handleAppleIAPCancel(body);
          }
        } else if (
          decodeId?.notificationType === EEventType.didPurchase &&
          decodeId?.subtype === EEventType.subTypeInitial
        ) {
          await this.handleAppleIAPPurchase(decodeId);
        } else if (
          decodeId?.notificationType === EEventType.expired &&
          decodeId?.subtype === EEventType.expiredSubType
        ) {
          await this.handleIapExpired(decodeId);
        }
      } else if (provider == EProvider.google) {
        const eventType = await this.subscriptionFactory.googleRtdn(
          req?.body?.message
        );
        // console.log("eventType", eventType.notificationType);
        if (eventType.notificationType === EEventId.renew) {
          await this.handleGoogleIAPRenew(req.body);
        } else if (eventType.notificationType === EEventId.cancel) {
          await this.handleGoogleIAPCancel(req.body);
        }
        // else if (eventType.notificationType === EEventId.purchase) {
        //   await this.handleGoogleIAPPurchase(req.body);
        // }
      }
    } catch (err) {
      throw err;
    }
  }
  async handleAppleIAPPurchase(payload) {
    try {
      const transactionHistory =
        await this.subscriptionFactory.getTransactionHistory(payload);
      // console.log("transactionHistory", transactionHistory);
      const transactionId = transactionHistory?.transactions?.transactionId;
      const originalTransactionId =
        transactionHistory?.transactions?.originalTransactionId;
      const existingSubscription = await this.subscriptionModel.findOne({
        "transactionDetails.originalTransactionId": originalTransactionId,
      });
      // console.log("existingSubscription", existingSubscription);

      if (!existingSubscription) {
        return { message: "No matching subscription found." };
      }
      const metaData = {
        transaction: transactionHistory.transactions,
        renewal: transactionHistory.renewalInfo,
      };
      const updateResult = await this.subscriptionModel.updateOne(
        {
          _id: existingSubscription._id,
          subscriptionStatus: EsubscriptionStatus.initiated,
          status: EStatus.Active,
          providerId: EProviderId.apple,
        },
        {
          $set: {
            subscriptionStatus: EsubscriptionStatus.active,
            metaData: metaData,
            endAt: new Date(transactionHistory.transactions.expiresDate),
          },
        }
      );
      let item = await this.itemService.getItemDetail(
        existingSubscription?.notes?.itemId
      );
      let userBody = {
        userId: existingSubscription?.userId,
        membership: item?.itemName,
        badge: item?.additionalDetail?.badge,
      };
      await this.helperService.updateUser(userBody);
      // console.log("updateResult", updateResult);
      if (updateResult.modifiedCount > 0) {
        const updatedInvoice = await this.invoiceService.updateInvoice(
          existingSubscription._id,
          EDocumentStatus.completed
        );
        // console.log("updatedInvoice", updatedInvoice);

        await this.paymentService.updateStatus(
          updatedInvoice.invoice._id,
          EDocumentStatus.completed
        );

        const body = {
          status: EDocumentStatus.completed,
          updatedAt: new Date(),
        };

        await this.mandateService.updateIapStatus(transactionId, body);
        await this.mandateHistoryService.updateIapMandateStatus(
          transactionId,
          body
        );
      }

      return { message: "Updated Successfully" };
    } catch (err) {
      throw err;
    }
  }

  async handleAppleIAPRenew(payload) {
    try {
      const transactionHistory =
        await this.subscriptionFactory.getTransactionHistory(payload);
      const matchedSubscription = await this.subscriptionModel.findOne({
        providerId: EProviderId.apple,
        subscriptionStatus: EStatus.Active,
        "metaData.transaction.originalTransactionId":
          transactionHistory?.transactions?.originalTransactionId,
      });
      if (
        matchedSubscription?.metaData?.transaction?.transactionId !==
        transactionHistory?.transactions?.transactionId
      ) {
        const existingSubscription = await this.subscriptionModel.findOne({
          providerId: EProviderId.apple,
          "metaData.transaction.originalTransactionId":
            transactionHistory?.transactions?.originalTransactionId,
        });
        const metaData = {
          transaction: transactionHistory.transactions,
          renewal: transactionHistory.renewalInfo,
        };

        let currencyId = await this.helperService.getCurrencyId(
          transactionHistory?.transactions?.currency
        );
        const price = transactionHistory?.transactions?.price / 1000;
        let currencyResponse = currencyId?.data?.[0];
        const subscriptionData = {
          userId: existingSubscription?.userId,
          planId: existingSubscription?.planId,
          subscriptionStatus: EStatus.Active,
          startAt: new Date(transactionHistory.transactions.purchaseDate),
          endAt: new Date(transactionHistory.transactions.expiresDate),
          amount: price,
          status: EStatus.Active,
          notes: { itemId: existingSubscription?.notes?.itemId },
          createdBy: existingSubscription?.userId,
          updatedBy: existingSubscription?.userId,
          metaData: metaData,
          providerId: EProviderId.apple,
          provider: EProvider.apple,
          externalId: transactionHistory.transactions.originalTransactionId,
          currencyCode: currencyResponse.currency_code,
          currencyId: currencyResponse._id,
          transactionDetails: {
            transactionId: transactionHistory?.transactions?.transactionId,
            originalTransactionId:
              transactionHistory?.transactions?.originalTransactionId,
            authAmount: price,
            transactionDate: transactionHistory?.transactions?.purchaseDate,
            planId: transactionHistory?.transactions?.productId,
          },
        };
        let subscription =
          await this.subscriptionModel.create(subscriptionData);
        let item = await this.itemService.getItemDetail(
          subscription?.notes?.itemId
        );
        let userBody = {
          userId: subscription?.userId,
          membership: item?.itemName,
          badge: item?.additionalDetail?.badge,
        };
        await this.helperService.updateUser(userBody);
        const invoiceData = {
          itemId: existingSubscription?.notes.itemId,
          source_id: subscription._id,
          source_type: "subscription",
          sub_total: price,
          document_status: EDocumentStatus.completed,
          grand_total: price,
          currencyCode: transactionHistory?.transactions?.currency,
          user_id: existingSubscription?.userId,
          created_by: existingSubscription?.userId,
          updated_by: existingSubscription?.userId,
        };
        const invoice = await this.invoiceService.createInvoice(
          invoiceData,
          subscription?.userId
        );
        const conversionRateAmt = await this.helperService.getConversionRate(
          transactionHistory?.transactions?.currency,
          price
        );
        let amt = parseInt((price * conversionRateAmt).toString());
        const paymentData = {
          amount: price,
          document_status: EDocumentStatus.completed,
          providerId: EProviderId.apple,
          providerName: EProvider.apple,
          transactionDate: new Date(),
          currency: existingSubscription.currencyId,
          currencyCode: existingSubscription.currencyCode,
          userId: existingSubscription.userId,
          baseAmount: amt,
          baseCurrency: "INR",
          conversionRate: conversionRateAmt,
        };
        await this.paymentService.createPaymentRecord(
          paymentData,
          null,
          invoice
        );
        const subscriptionCount = await this.countUserSubscriptions(subscription?.userId);
        let mixPanelBody: any = {};
        mixPanelBody.eventName = EMixedPanelEvents.subscription_add;
        mixPanelBody.distinctId = subscription?.userId;
        mixPanelBody.properties = {
          user_id: subscription?.userId,
          provider: subscription?.provider,
          subscription_id: subscription._id,
          subscription_status: subscription?.subscriptionStatus,
          subscription_date: subscription?.startAt,
          item_name: item?.itemName,
          subscription_expired: subscription?.endAt,
          subscription_count: subscriptionCount,
          subscription_mode: ESubscriptionMode.Charge,
          subscription_amount: price
        };
        await this.helperService.mixPanel(mixPanelBody);
      }
    } catch (error) {
      throw error;
    }
  }

  async handleAppleIAPCancel(payload) {
    try {
      const transactionHistory =
        await this.subscriptionFactory.getTransactionHistory(payload);
      const existingMandate = await this.mandateService.getMandateBySourceId(
        transactionHistory?.transactions?.originalTransactionId,
        EMandateStatus.active
      );
      if (existingMandate?.mandateStatus === EMandateStatus.active) {
        let existingSubscription = await this.subscriptionModel.findOne({
          "metaData.transaction.originalTransactionId":
            transactionHistory?.transactions?.originalTransactionId,
        });
        let body = {
          status: EMandateStatus.cancelled,
          updatedAt: new Date(),
        };
        let mandates = await this.mandateService.updateIapStatusCancel(
          existingSubscription?._id,
          body
        );
        const metaData = {
          transaction: transactionHistory.transactions,
          renewal: transactionHistory.renewalInfo,
        };
        await this.mandateHistoryService.createMandateHistory({
          mandateId: mandates?._id,
          mandateStatus: EMandateStatus.cancelled,
          metaData: metaData,
          status: EStatus.Active,
          createdBy: existingMandate?.userId,
          updatedBy: existingMandate?.userId,
        });
        let itemName = await this.itemService.getItemDetail(
          existingSubscription?.notes?.itemId
        );

        let mixPanelBody: any = {};
        mixPanelBody.eventName = EMixedPanelEvents.mandate_cancelled;
        mixPanelBody.distinctId = existingMandate?.userId;
        mixPanelBody.properties = {
          mandate_id: mandates?._id,
          user_id: existingMandate?.userId,
          mandate_status: EMandateStatus.cancelled,
          date: new Date().toISOString(),
          item_name: itemName?.itemName,
          provider: EProvider.apple,
        };
        await this.helperService.mixPanel(mixPanelBody);
        return { message: "Cancellation processed successfully" };
      }
    } catch (error) {
      throw error;
    }
  }
  async handleIapExpired(payload) {
    try {
      const transactionHistory =
        await this.subscriptionFactory.getTransactionHistory(payload);
      const metaData = {
        transaction: transactionHistory.transactions,
        renewal: transactionHistory.renewalInfo,
      };
      const existingSubscription =
        await this.subscriptionModel.findOneAndUpdate(
          {
            "metaData.transaction.originalTransactionId":
              transactionHistory?.transactions?.originalTransactionId,
          },
          {
            subscriptionStatus: EsubscriptionStatus.expired,
            updatedAt: new Date(),
            metaData: metaData,
          }
        );

      let updatedInvoice = await this.invoiceService.updateInvoice(
        existingSubscription?._id,
        EDocumentStatus.expired
      );
      // console.log("updatedInvoice", updatedInvoice);
      return existingSubscription;
    } catch (error) {
      throw error;
    }
  }
  // google iap
  async handleGoogleIAPPurchase(payload) {
    try {
      // console.log("payload", payload);
      const rtdn = await this.subscriptionFactory.googleRtdn(payload.message);
      let subscription;
      if (rtdn.notificationType === EEventId.purchase) {
        let existingSubscription = await this.subscriptionModel.findOne({
          externalId: rtdn.purchaseToken,
        });
        subscription = await this.subscriptionModel.findOneAndUpdate(
          {
            externalId: rtdn.purchaseToken,
            subscriptionStatus: EsubscriptionStatus.initiated,
            status: EStatus.Active,
            providerId: EProviderId.google,
          },
          {
            $set: {
              subscriptionStatus: EsubscriptionStatus.active,
              endAt: rtdn?.transactionInfo?.lineItems[0]?.expiryTime,
              metaData: rtdn?.transactionInfo,
            },
          }
        );
        let item = await this.itemService.getItemDetail(
          subscription?.notes?.itemId
        );
        let userBody = {
          userId: subscription?.userId,
          membership: item?.itemName,
          badge: item?.additionalDetail?.badge,
        };
        await this.helperService.updateUser(userBody);
        let updatedInvoice = await this.invoiceService.updateInvoice(
          existingSubscription._id,
          EDocumentStatus.completed
        );
        let currency =
          rtdn?.transactionInfo?.lineItems[0]?.autoRenewingPlan?.recurringPrice
            ?.currencyCode;
        let price =
          rtdn?.transactionInfo?.lineItems?.[0]?.autoRenewingPlan
            ?.recurringPrice?.units;
        let conversionRateAmt = await this.helperService.getConversionRate(
          currency,
          price
        );
        let baseAmount = parseInt((price * conversionRateAmt).toString());
        let currencyId = await this.helperService.getCurrencyId(currency);
        let currencyResponse = currencyId?.data?.[0];
        let conversionBody = {
          baseAmount: baseAmount,
          baseCurrency: currencyResponse.currency_code,
          conversionRate: conversionRateAmt,
          metaData: {
            externalId: rtdn?.purchaseToken,
            latestOrderId: rtdn?.transactionInfo?.latestOrderId,
          },
        };
        let statusData = {
          status: EDocumentStatus.completed,
          conversionBody,
        };
        let payment = await this.paymentService.updateStatus(
          updatedInvoice.invoice._id,
          statusData
        );
        let body = {
          status: EDocumentStatus.active,
          updatedAt: new Date(),
        };
        let transactionId = rtdn.purchaseToken;
        await this.mandateService.updateIapStatus(transactionId, body);
        await this.mandateHistoryService.updateIapMandateStatus(
          transactionId,
          body
        );
      }
      return subscription;
    } catch (err) {
      // console.error("Error in handleGoogleIAPPurchase:", err);
      throw err;
    }
  }
  async handleGoogleIAPRenew(payload) {
    try {
      // console.log("payload is", payload);

      const rtdn = await this.subscriptionFactory.googleRtdn(payload.message);
      if (rtdn.notificationType === EEventId.renew) {
        const orderId = (id: string = "") => id.split("..")[0];
        const latestOrderId = orderId(rtdn?.transactionInfo?.latestOrderId);
        console.log("latestOrderId", latestOrderId);
        const existingSubscription = await this.subscriptionModel.findOne({
          providerId: EProviderId.google,
          provider: EProvider.google,
          status: EStatus.Active,
          "metaData.latestOrderId": latestOrderId,
        });

        if (
          existingSubscription?.subscriptionStatus !==
          EsubscriptionStatus.active
        ) {
          let currency =
            rtdn?.transactionInfo?.lineItems[0]?.autoRenewingPlan
              ?.recurringPrice?.currencyCode;
          let price =
            rtdn?.transactionInfo?.lineItems?.[0]?.autoRenewingPlan
              ?.recurringPrice?.units;

          let currencyId = await this.helperService.getCurrencyId(currency);
          let currencyResponse = currencyId?.data?.[0];

          let conversionRateAmt = await this.helperService.getConversionRate(
            currency,
            price
          );
          let baseAmount = parseInt((price * conversionRateAmt).toString());

          const subscriptionData = {
            userId: existingSubscription?.userId,
            planId: existingSubscription?.planId,
            subscriptionStatus: EStatus.Active,
            startAt: new Date(),
            endAt: new Date(rtdn?.transactionInfo?.lineItems[0]?.expiryTime),
            amount: price,
            status: EStatus.Active,
            notes: { itemId: existingSubscription?.notes?.itemId },
            createBy: existingSubscription?.userId,
            updateBy: existingSubscription?.userId,
            metaData: rtdn?.transactionInfo,
            providerId: EProviderId.google,
            provider: EProvider.google,
            paymentType: EPaymentType.charge,
            externalId: rtdn?.purchaseToken,
            currencyCode: currencyResponse?.currency_code,
            currencyId: currencyResponse?._id,
            transactionDetails: {
              transactionId: rtdn?.purchaseToken,
              authAmount:
                rtdn?.transactionInfo?.lineItems[0]?.autoRenewingPlan
                  ?.recurringPrice?.units,
              transactionDate: rtdn?.transactionInfo?.startTime,
              planId: rtdn?.transactionInfo?.lineItems[0]?.productId,
            },
          };
          let subscription =
            await this.subscriptionModel.create(subscriptionData);
          let item = await this.itemService.getItemDetail(
            subscription?.notes?.itemId
          );
          let userBody = {
            userId: subscription?.userId,
            membership: item?.itemName,
            badge: item?.additionalDetail?.badge,
          };
          await this.helperService.updateUser(userBody);
          const invoiceData = {
            itemId: existingSubscription?.notes.itemId,
            source_id: subscription?._id,
            source_type: "subscription",
            sub_total: price,
            document_status: EDocumentStatus.completed,
            grand_total: price,
            user_id: subscription?.userId,
            currencyCode: currencyResponse?.currency_code,
            created_by: subscription?.userId,
            updated_by: subscription?.userId,
          };
          const invoice = await this.invoiceService.createInvoice(
            invoiceData,
            subscription?.userId
          );
          const paymentData = {
            amount: price,
            document_status: EDocumentStatus.completed,
            providerId: EProviderId.google,
            providerName: EProvider.google,
            transactionDate: new Date(),
            currencyCode: currencyResponse?.currency_code,
            currencyId: currencyResponse?._id,
            userId: existingSubscription?.userId,
            paymentType: EPaymentType.charge,
            baseAmount: baseAmount,
            baseCurrency: "INR",
            conversionRate: conversionRateAmt,
            metaData: {
              externalId: rtdn?.purchaseToken,
              latestOrderId: rtdn?.transactionInfo?.latestOrderId,
            },
          };
          await this.paymentService.createPaymentRecord(
            paymentData,
            null,
            invoice
          );
          let subscriptionCount = await this.countUserSubscriptions(subscription?.userId);
          let mixPanelBody: any = {};
          mixPanelBody.eventName = EMixedPanelEvents.subscription_add;
          mixPanelBody.distinctId = subscription?.userId;
          mixPanelBody.properties = {
            user_id: subscription?.userId,
            provider: subscription?.provider,
            subscription_id: subscription._id,
            subscription_status: subscription?.subscriptionStatus,
            subscription_date: subscription?.startAt,
            item_name: item?.itemName,
            subscription_expired: subscription?.endAt,
            subscription_count: subscriptionCount,
            subscription_mode: ESubscriptionMode.Charge,
            subscription_amount: price
          };
          await this.helperService.mixPanel(mixPanelBody);
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async handleGoogleIAPCancel(payload) {
    try {
      const rtdn = await this.subscriptionFactory.googleRtdn(payload.message);
      let existingMandate = await this.mandateService.getMandateBySourceId(
        rtdn?.purchaseToken,
        EMandateStatus.active
      );
      if (
        rtdn.notificationType === EEventId.cancel &&
        existingMandate?.mandateStatus === EMandateStatus.active
      ) {
        const body = {
          status: EMandateStatus.cancelled,
          updatedAt: new Date(),
        };
        const transactionId = rtdn.purchaseToken;
        let mandate = await this.mandateService.updateIapStatus(
          transactionId,
          body
        );
        await this.mandateHistoryService.createMandateHistory({
          mandateId: mandate?._id,
          mandateStatus: EMandateStatus.cancelled,
          metaData: rtdn.transactionInfo,
          status: EStatus.Active,
          createdBy: mandate?.userId,
          updatedBy: mandate?.userId,
        });
        let subscriptionData = await this.subscriptionModel.findOne({
          _id: mandate?.sourceId,
        });
        let itemName = await this.itemService.getItemDetail(
          subscriptionData?.notes?.itemId
        );

        let mixPanelBody: any = {};
        mixPanelBody.eventName = EMixedPanelEvents.mandate_cancelled;
        mixPanelBody.distinctId = mandate?.userId;
        mixPanelBody.properties = {
          mandate_id: mandate?._id,
          user_id: mandate?.userId,
          mandate_status: EMandateStatus.cancelled,
          date: new Date().toISOString(),
          item_name: itemName?.itemName,
          provider: EProvider.google,
        };
        await this.helperService.mixPanel(mixPanelBody);
      }
    } catch (error) {
      throw error;
    }
  }

  async handleCashfreeFailedPayment(payload: CashfreeFailedPaymentPayload) {
    try {
      const cfPaymentId = payload?.data?.cf_payment_id;
      // console.log("cfPaymentId", cfPaymentId);

      let failedReason = payload?.data?.failure_details?.failure_reason;
      // console.log("failure details is", payload?.data?.failure_details);
      let body = {
        document_status: EPaymentStatus.failed,
        reason: failedReason,
      };
      const paymentRecord =
        await this.paymentService.fetchPaymentByOrderId(cfPaymentId);
      // console.log("paymentRecord", paymentRecord);

      await this.paymentService.updateMetaData(
        paymentRecord._id as string,
        payload
      );
      // console.log("invoice id is", paymentRecord?.source_id);

      await this.paymentService.updateStatus(paymentRecord._id, body);
      let updatedInvoice = await this.invoiceService.updateInvoice(
        paymentRecord?.source_id,
        EPaymentStatus.failed
      );
      // console.log("subscription id is", updatedInvoice?.invoice?.source_id);

      await this.subscriptionModel.updateOne(
        {
          _id: updatedInvoice?.invoice?.source_id,
          subscriptionStatus: EsubscriptionStatus.initiated,
        },
        {
          $set: {
            subscriptionStatus: EsubscriptionStatus.failed,
          },
        }
      );
      return { message: "Updated Successfully" };
    } catch (err) {
      throw err;
    }
  }

  async handleRazorpayCancelledMandate(payload: any) {
    try {
      let tokenId = payload?.token?.entity?.id;
      let mandate = await this.mandateService.getMandateById(tokenId);
      let data = await this.mandateService.updateMandateDetail(
        { _id: mandate?._id },
        {
          mandateStatus: EMandateStatus.cancel_initiated,
        }
      );
      await this.mandateHistoryService.createMandateHistory({
        mandateId: mandate?._id,
        mandateStatus: EMandateStatus.cancel_initiated,
        "metaData.additionalDetail": payload?.token?.entity,
        status: EStatus.Active,
        createdBy: payload?.token?.entity?.notes?.userId,
        updatedBy: payload?.token?.entity?.notes?.userId,
      });
      let subscriptionData = await this.subscriptionModel.findOne({
        _id: new ObjectId(mandate?.sourceId),
      });
      let itemName = await this.itemService.getItemDetail(
        subscriptionData?.notes?.itemId
      );
      let mixPanelBody: any = {};
      mixPanelBody.eventName = EMixedPanelEvents.mandate_cancelled;
      mixPanelBody.distinctId = mandate?.userId;
      mixPanelBody.properties = {
        mandate_id: mandate?._id,
        user_id: mandate?.userId,
        mandate_status: EMandateStatus.cancelled,
        date: new Date().toISOString(),
        item_name: itemName?.itemName,
        provider: mandate?.provider,
      };
      await this.helperService.mixPanel(mixPanelBody);
    } catch (err) {
      throw err;
    }
  }

  async handleRazorpayCancelMandate(payload: any) {
    try {
      // console.log("inside razorpay cancelled mandate", payload);

      let tokenId = payload?.token?.entity?.id;
      let status = payload?.token?.entity?.recurring_details?.status;
      let mandate = await this.mandateService.getMandateById(tokenId);

      let data = await this.mandateService.updateMandateDetail(
        { _id: mandate?._id },
        {
          mandateStatus: EMandateStatus.cancelled,
        }
      );
      await this.mandateHistoryService.createMandateHistory({
        mandateId: mandate?._id,
        mandateStatus: EMandateStatus.cancelled,
        "metaData.additionalDetail": payload?.token?.entity,
        status: EStatus.Active,
        createdBy: payload?.token?.entity?.notes?.userId,
        updatedBy: payload?.token?.entity?.notes?.userId,
      });

      let subscriptionData = await this.subscriptionModel.findOne({
        _id: new ObjectId(mandate?.sourceId),
      });
      let itemName = await this.itemService.getItemDetail(
        subscriptionData?.notes?.itemId
      );

      let mixPanelBody: any = {};
      mixPanelBody.eventName = EMixedPanelEvents.mandate_cancelled;
      mixPanelBody.distinctId = mandate?.userId;
      mixPanelBody.properties = {
        mandate_id: mandate?._id,
        user_id: mandate?.userId,
        mandate_status: EMandateStatus.cancelled,
        date: new Date().toISOString(),
        item_name: itemName?.itemName,
        provider: mandate?.provider,
      };
      await this.helperService.mixPanel(mixPanelBody);
    } catch (err) {
      throw err;
    }
  }

  async handleRazorpayRejectedMandate(payload: any) {
    try {
      // console.log("inside razorpay rejected mandate", payload);

      let tokenId = payload?.token?.entity?.id;
      let status = payload?.token?.entity?.recurring_details?.status;
      let mandate = await this.mandateService.getMandateById(tokenId);
      let data = await this.mandateService.updateMandateDetail(
        { _id: mandate?._id },
        {
          mandateStatus: EMandateStatus.rejected,
        }
      );
      await this.mandateHistoryService.createMandateHistory({
        mandateId: mandate?._id,
        mandateStatus: EMandateStatus.rejected,
        "metaData.additionalDetail": payload?.token?.entity,
        status: EStatus.Active,
        createdBy: payload?.token?.entity?.notes?.userId,
        updatedBy: payload?.token?.entity?.notes?.userId,
      });
    } catch (err) {
      throw err;
    }
  }

  async handleRazorpayPausedMandate(payload: any) {
    try {
      // console.log("inside razorpay paused mandate", payload);

      let tokenId = payload?.token?.entity?.id;
      let status = payload?.token?.entity?.recurring_details?.status;
      let mandate = await this.mandateService.getMandateById(tokenId);
      let data = await this.mandateService.updateMandateDetail(
        { _id: mandate?._id },
        {
          mandateStatus: EMandateStatus.paused,
        }
      );
      await this.mandateHistoryService.createMandateHistory({
        mandateId: mandate?._id,
        mandateStatus: EMandateStatus.paused,
        "metaData.additionalDetail": payload?.token?.entity,
        status: EStatus.Active,
        createdBy: payload?.token?.entity?.notes?.userId,
        updatedBy: payload?.token?.entity?.notes?.userId,
      });
    } catch (err) {
      throw err;
    }
  }

  async handleRazorpayFailedPayment(payload: any) {
    try {
      const razpPaymentOrderId = payload?.payment?.entity?.order_id;
      // console.log("cfPaymentId", cfPaymentId);

      let failedReason = payload?.payment?.entity?.error_reason;
      // console.log("failure details is", payload?.data?.failure_details);
      let body = {
        document_status: EPaymentStatus.failed,
        reason: failedReason,
      };
      const paymentRecord =
        await this.paymentService.fetchPaymentByOrderId(razpPaymentOrderId);
      // console.log("paymentRecord", paymentRecord);

      await this.paymentService.updateMetaData(
        paymentRecord._id as string,
        payload?.payment?.entity
      );
      // console.log("invoice id is", paymentRecord?.source_id);

      await this.paymentService.updateStatus(paymentRecord._id, body);
      let updatedInvoice = await this.invoiceService.updateInvoice(
        paymentRecord?.source_id,
        EPaymentStatus.failed
      );
      // console.log("subscription id is", updatedInvoice?.invoice?.source_id);

      await this.subscriptionModel.updateOne(
        {
          _id: updatedInvoice?.invoice?.source_id,
          subscriptionStatus: EsubscriptionStatus.initiated,
        },
        {
          $set: {
            subscriptionStatus: EsubscriptionStatus.failed,
          },
        }
      );
      return { message: "Updated Successfully" };
    } catch (err) {
      throw err;
    }
  }
  private async handleRazorpayMandate(payload: any) {
    try {
      let tokenId = payload?.token?.entity?.id;
      // console.log("tokenId", tokenId);
      // console.log("token confirmed payload", payload);

      let mandate = await this.mandateService.getMandateById(tokenId);
      // console.log("token confirmed mandate", mandate);

      let updatedMandate = await this.mandateService.updateMandateDetail(
        { _id: mandate._id },
        {
          mandateStatus: EMandateStatus.active,
        }
      );
      await this.mandateHistoryService.createMandateHistory({
        mandateId: mandate?._id,
        mandateStatus: EMandateStatus.active,
        "metaData.additionalDetail": payload?.token?.entity,
        status: EStatus.Active,
        createdBy: mandate?.createdBy,
        updatedBy: mandate?.updatedBy,
      });
    } catch (err) {
      throw err;
    }
  }
  private async handleRazorpaySubscriptionPayment(payload: any) {
    try {
      const rzpPaymentId = payload?.payment?.entity?.order_id;
      let paymentRequest =
        await this.paymentService.fetchPaymentByOrderId(rzpPaymentId);
      let updatedStatus = await this.paymentService.completePayment({
        invoiceId: paymentRequest?.source_id,
        paymentId: paymentRequest?._id,
      });
      let invoice = await this.invoiceService.getInvoiceDetail(
        paymentRequest?.source_id
      );
      let subscription = await this.subscriptionModel.findOne({
        _id: invoice?.source_id,
      });
      if (subscription) {
        if (subscription.subscriptionStatus !== EsubscriptionStatus.active) {
          // console.log("subscription", subscription);
          subscription.subscriptionStatus = EsubscriptionStatus.active;
          await subscription.save();

          let tokenId = payload?.payment?.entity?.token_id;
          let updatedMandate = await this.mandateService.updateMandateDetail(
            { "metaData.subscriptionId": subscription?.subscriptionId },
            {
              referenceId: tokenId,
            }
          );
          let mandate = await this.mandateService.getMandateById(tokenId);
          if (mandate && mandate.mandateStatus == EMandateStatus.initiated) {
            let updatedMandate = await this.mandateService.updateMandateDetail(
              { _id: mandate._id },
              {
                mandateStatus: EMandateStatus.active,
              }
            );
            await this.mandateHistoryService.createMandateHistory({
              mandateId: mandate?._id,
              mandateStatus: EMandateStatus.active,
              "metaData.additionalDetail": payload?.token?.entity,
              status: EStatus.Active,
              createdBy: mandate?.createdBy,
              updatedBy: mandate?.updatedBy,
            });
          }

          let item = await this.itemService.getItemDetail(
            subscription?.notes?.itemId
          );
          let userBody = {
            userId: subscription?.userId,
            membership: item?.itemName,
            badge: item?.additionalDetail?.badge,
          };
          await this.helperService.updateUser(userBody);
          let subscriptionCount = await this.countUserSubscriptions(subscription?.userId);
          let mixPanelBody: any = {};
          mixPanelBody.eventName = EMixedPanelEvents.subscription_add;
          mixPanelBody.distinctId = subscription?.userId;
          mixPanelBody.properties = {
            user_id: subscription?.userId,
            provider: EProvider.razorpay,
            subscription_id: subscription._id,
            subscription_status: EsubscriptionStatus.active,
            subscription_date: subscription?.startAt,
            item_name: item?.itemName,
            subscription_expired: subscription?.endAt,
            subscription_count: subscriptionCount,
            subscription_mode: paymentRequest?.paymentType,
            subscription_amount: invoice.grand_total
          };
          await this.helperService.mixPanel(mixPanelBody);
          let firstSubscription = await this.userFirstSubscription(subscription?.userId);
          let propertie = {
            first_subscription_date: firstSubscription?.startAt
          }
          await this.helperService.setUserProfile({ distinctId: subscription?.userId,properties: propertie});
          let userData = await this.helperService.getUserById(
            subscription?.userId
          );
          // await this.helperService.facebookEvents(
          //   userData.data.phoneNumber,
          //   invoice.currencyCode,
          //   invoice.grand_total
          // );
          if (item?.additionalDetail?.subscriptionDetail?.amount === subscription?.amount) {
            try {
              let userAdditional = await this.helperService.getUserAdditional(subscription?.userId)
              
              if (userAdditional?.referredBy) {
                try {
                  let referelData = await this.helperService.getReferralData(subscription?.userId, userAdditional?.referredBy)
                  
                  if (referelData?.referralStatus === EReferralStatus.Onboarded) {
                    let eventBody = {
                      subscriptionId: subscription?._id,
                      userId: subscription?.userId,
                    }
                    await this.sharedService.trackAndEmitEvent(
                      EVENT_UPDATE_REFERRAL_STATUS,
                      eventBody,
                      true,
                      {}
                    );
                  }
                } catch (referralError) {
                  console.warn(`Referral data fetch failed for user ${payload?.userId}:`, referralError?.message || referralError)
                }
              }
            } catch (userAdditionalError) {
              console.warn(`User additional data fetch failed for user ${subscription?.userId}:`, userAdditionalError?.message || userAdditionalError)
            }
          }
        }
      }
      if(invoice?.source_type === ECoinTransactionTypes.coinTransaction){
        try {
          // console.log("paymentRequest", paymentRequest);
          
          // Get coin data
          let coinData = await this.currencyService.getCurrencyByCurrencyName(
            ECurrencyName.currencyId,
            ECurrencyName.casttreeCoin
          );
          // console.log("coinData", coinData);
          
          // Find coin transaction
          let coinTransaction = await this.coinTransactionModel.findOne({
            sourceId: new ObjectId(invoice?._id),
            transactionType: ETransactionType.In,
            type: ETransactionType.purchased,
          });
          // console.log("coinTransaction", coinTransaction);
          
          // Update user coin balance if transaction is pending
          if (
            coinTransaction?.documentStatus === ECoinStatus.pending &&
            coinTransaction?.transactionType === ETransactionType.In
          ) {
            let updateUserAdditional =
              await this.helperService.updateUserPurchaseCoin({
                userId: coinTransaction?.userId,
                coinValue: coinTransaction?.coinValue,
              });
            // console.log("updateUserAdditional", updateUserAdditional);
            
            let totalBalance =
              (updateUserAdditional?.purchasedBalance || 0) +
              (updateUserAdditional?.earnedBalance || 0);
              
            // Update coin transaction status
            await this.coinTransactionModel.updateOne(
              {
                sourceId: new ObjectId(invoice?._id),
                transactionType: ETransactionType.In,
                documentStatus: ECoinStatus.pending,
              },
              {
                $set: {
                  documentStatus: ECoinStatus.completed,
                  updatedAt: new Date(),
                  currentBalance: totalBalance,
                },
              }
            );
          }
          
          // Handle coin transaction out (withdrawal)
          let coinTransactionOut = await this.coinTransactionModel.findOne({
            sourceId: new ObjectId(invoice?._id),
            transactionType: ETransactionType.Out,
            type: ETransactionType.withdrawn,
          });
          // console.log("coinTransactionOut", coinTransactionOut);
          
          if (
            coinTransactionOut?.documentStatus === ECoinStatus.pending &&
            coinTransactionOut?.transactionType === ETransactionType.Out
          ) {
            let updateUserAdditionalData =
              await this.helperService.updateAdminCoinValue({
                userId: coinTransactionOut?.userId,
                coinValue: coinTransactionOut?.coinValue,
              });
            // console.log("updateUserAdditionalData", updateUserAdditionalData);
            
            await this.coinTransactionModel.updateOne(
              {
                sourceId: new ObjectId(invoice?._id),
                transactionType: ETransactionType.Out,
                documentStatus: ECoinStatus.pending,
              },
              {
                $set: {
                  documentStatus: ECoinStatus.completed,
                  updatedAt: new Date(),
                  currentBalance: updateUserAdditionalData?.purchasedBalance,
                },
              }
            );
          }
          
          // Send MixPanel event
          let mixPanelBody: any = {};
          mixPanelBody.eventName = EMixedPanelEvents.coin_purchase_success;
          mixPanelBody.distinctId = coinTransaction?.userId;
          mixPanelBody.properties = {
            user_id: coinTransaction?.userId,
            amount: paymentRequest?.amount,
            currency: invoice?.currencyCode,
            coin_value: coinTransaction?.coinValue,
          };
          await this.helperService.mixPanel(mixPanelBody);
          
        } catch (error) {
          console.warn(
            `Coin transaction update failed for user ${subscription?.userId}:`,
            error?.message || error
          );
        }
      }
    } catch (err) {
      throw err;
    }
  }
  // Handles Razorpay subscription logic
  private async handleRazorpaySubscription(payload: any) {
    let existingSubscription = await this.subscriptionModel.findOne({
      userId: payload.subscription?.entity?.notes?.userId,
    });
    if (!existingSubscription) {
      let fv: SubscriptionData = {
        userId: payload.subscription?.entity?.notes?.userId,
        planId: payload.subscription?.entity?.plan_id,
        totalCount: payload.subscription?.entity?.total_count,
        currentStart: payload.subscription?.entity?.current_start,
        quantity: payload.subscription?.entity?.quantity,
        currentEnd: payload.subscription?.entity?.current_end,
        scheduleChangeAt: payload.subscription?.entity?.change_scheduled_at,
        endAt: payload.subscription?.entity?.end_at,
        paidCount: payload.subscription?.entity?.paid_count,
        expireBy: payload.subscription?.entity?.expire_by,
        notes: payload.subscription?.entity?.notes,
        subscriptionStatus: payload.subscription?.entity?.status,
        metaData: payload,
        status: EStatus.Active,
        createdBy: payload.subscription?.entity?.notes?.userId,
        updatedBy: payload.subscription?.entity?.notes?.userId,
      };
      let subscription = await this.subscriptionModel.create(fv);
      let invoice = await this.invoiceService.createInvoice(
        {
          source_id: payload.subscription?.entity?.notes?.sourceId,
          source_type: "process",
          sub_total: payload.payment?.entity?.amount,
          document_status: EDocumentStatus.completed,
          grand_total: payload.payment?.entity?.amount,
        },
        payload.subscription?.entity?.notes?.userId
      );

      let invoiceFV: PaymentRecordData = {
        amount: payload.payment?.entity?.amount,
        invoiceDetail: { sourceId: invoice._id.toString() },
        document_status: EDocumentStatus.completed,
      };

      await this.paymentService.createPaymentRecord(
        invoiceFV,
        null,
        invoice,
        null,
        null
      );

      let item = await this.itemService.getItemDetail(
        payload.subscription?.entity?.notes?.itemId
      );

      let userBody: UserUpdateData = {
        userId: payload.subscription?.entity?.notes?.userId,
        membership: item?.itemName,
        badge: item?.additionalDetail?.badge,
      };

      await this.helperService.updateUser(userBody);
    }
  }
  async handleRazorpayRefund(payload: any) {
    try {
      const paymentId = payload?.payment?.entity?.order_id;
      const refundReason = payload?.refund?.entity?.notes?.reason;

      const paymentRecord = await this.paymentService.fetchPaymentByOrderId(paymentId);

      if (paymentRecord.document_status === EPaymentStatus.completed) {
        const paymentUpdateBody = {
          document_status: EPaymentStatus.failed,
          reason: {
            failureReason: refundReason,
          },
          isPaymentRefunded: true
        };

        await this.paymentService.updateStatus(
          paymentRecord._id,
          paymentUpdateBody,
          
        );
        await this.paymentService.updateMetaData(paymentRecord._id, payload);

        const updatedInvoice = await this.invoiceService.updateInvoice(
          paymentRecord.source_id,
          EPaymentStatus.failed
        );

        if (updatedInvoice?.invoice?.source_id) {
          const subscriptionUpdateResult =
            await this.subscriptionModel.updateOne(
              {
                _id: updatedInvoice.invoice.source_id,
                subscriptionStatus: EsubscriptionStatus.active
              },
              {
                $set: {
                  subscriptionStatus: EsubscriptionStatus.failed,
                  updatedAt: new Date(),
                },
              }
            );

          const subscription = await this.subscriptionModel.findOne(
            {
              _id: new ObjectId(updatedInvoice.invoice.source_id),
              subscriptionStatus: EsubscriptionStatus.failed
            }
          );

          if (subscription) {
            const userUpdateBody = {
              userId: subscription.userId,
              membership: "",
              badge: "",
            };

            await this.helperService.updateUser(userUpdateBody);
            // const item = await this.itemService.getItemDetail(subscription?.notes?.itemId);
            // const mixPanelBody: any = {
            //   eventName: EMixedPanelEvents.subscription_refund,
            //   distinctId: subscription.userId,
            //   properties: {
            //     user_id: subscription.userId,
            //     provider: EProvider.razorpay,
            //     subscription_id: subscription._id,
            //     subscription_status: EsubscriptionStatus.failed,
            //     refund_amount: refundAmount,
            //     refund_id: refundId,
            //     refund_reason: refundReason,
            //     item_name: item?.itemName,
            //     refund_date: new Date().toISOString()
            //   }
            // };
            // await this.helperService.mixPanel(mixPanelBody);
          }
        }
      }
      return { message: "Refund processed successfully" };
    } catch (error) {
      console.error("Error processing Razorpay refund:", error);
      throw error;
    }
  }

  // Handles Cashfree status change event
  private async handleCashfreeStatusChange(payload: any) {
    // console.log("inside handleCashfreeStatusChange is ===>", payload);
    const cfSubId = payload?.data?.subscription_details?.subscription_id;

    let statusChange = (str) => str.charAt(0) + str.slice(1).toLowerCase();
    let subscriptionStatus =
      payload?.data?.subscription_details?.subscription_status;

    const newStatus = statusChange(subscriptionStatus);
    // console.log("newStatus", newStatus);

    let mandate = await this.mandateService.getMandate(cfSubId);
    // console.log("mandate!!!!!!", mandate);
    if (mandate) {
      mandate.mandateStatus = newStatus;
      await mandate.save();

      await this.mandateHistoryService.createMandateHistory({
        mandateId: mandate._id,
        mandateStatus: newStatus,
        metaData: payload,
      });
      // await this.updateSubscriptionMetadata(cfSubId, payload);
    }
  }

  // private async updateSubscriptionMetadata(subscriptionId: string, metaData) {
  //   try {
  //     let response = await this.subscriptionModel.updateOne(
  //       { "metaData.subscription_id": subscriptionId },
  //       { $set: { "metaData.webhookResponse": metaData } }
  //     );
  //     return response;
  //   } catch (err) {
  //     throw err;
  //   }
  // }

  // Handles Cashfree new payment event
  private async handleCashfreeNewPayment(payload: CashfreeNewPaymentPayload) {
    try {
      const cfPaymentId = payload?.data?.cf_payment_id;

      let paymentRequest =
        await this.paymentService.fetchPaymentByOrderId(cfPaymentId);

      // if (
      //   !paymentRequest ||
      //   paymentRequest.document_status === EDocumentStatus.completed
      // ) {
      //   return;
      // }

      let updatedStatus = await this.paymentService.completePayment({
        invoiceId: paymentRequest?.source_id,
        paymentId: paymentRequest?._id,
      });
      let invoice = await this.invoiceService.getInvoiceDetail(
        paymentRequest?.source_id
      );
      let subscription = await this.subscriptionModel.findOne({
        _id: invoice?.source_id,
      });
      if (subscription) {
        if (subscription.subscriptionStatus !== EsubscriptionStatus.active) {
          subscription.subscriptionStatus = EsubscriptionStatus.active;
          await subscription.save();

          let item = await this.itemService.getItemDetail(
            subscription?.notes?.itemId
          );

          let mixPanelBodyData: any = {};
          mixPanelBodyData.eventName = EMixedPanelEvents.payment_success;
          mixPanelBodyData.distinctId = subscription?.userId;
          mixPanelBodyData.properties = {
            itemname: item.itemName,
            amount: invoice.grand_total,
            currency_code: invoice.currencyCode,
            serviceItemType: "subscription",
          };
          await this.helperService.mixPanel(mixPanelBodyData);
          let subscriptionCount = await this.countUserSubscriptions(subscription?.userId);
          let mixPanelBody: any = {};
          mixPanelBody.eventName = EMixedPanelEvents.subscription_add;
          mixPanelBody.distinctId = subscription?.userId;
          mixPanelBody.properties = {
            user_id: subscription?.userId,
            provider: EProvider.cashfree,
            subscription_id: subscription._id,
            subscription_status: EsubscriptionStatus.active,
            subscription_date: subscription?.startAt,
            item_name: item?.itemName,
            subscription_expired: subscription?.endAt,
            subscription_count: subscriptionCount,
            subscription_mode: ESubscriptionMode.Auth,
            subscription_amount: invoice.grand_total
          };
          await this.helperService.mixPanel(mixPanelBody);
          let firstSubscription = await this.userFirstSubscription(subscription?.userId);
          let propertie = {
            first_subscription_date: firstSubscription?.startAt
          }
          await this.helperService.setUserProfile({ distinctId: subscription?.userId,properties: propertie});
          let userBody = {
            userId: subscription?.userId,
            membership: item?.itemName,
            badge: item?.additionalDetail?.badge,
          };
          await this.helperService.updateUser(userBody);
          let userData = await this.helperService.getUserById(
            subscription?.userId
          );
          // await this.helperService.facebookEvents(
          //   userData.data.phoneNumber,
          //   invoice.currencyCode,
          //   invoice.grand_total
          // );
        }
      }
    } catch (err) {
      throw err;
    }
  }

  async validateSubscription(userId: string, status: String[]) {
    try {
      let subscription = await this.subscriptionModel.findOne({
        userId: userId,
        subscriptionStatus: { $nin: status },
        status: Estatus.Active,
      });
      return subscription;
    } catch (err) {
      throw err;
    }
  }

  async subscription(body, token) {
    try {
      // console.log("subscription data", body);

      let subscriptionData = {
        userId: token.id,
        planId: body.planId,
        subscriptionId: body?.subscriptionId,
        startAt: body.startAt,
        endAt: body.endAt,
        notes: body.notes,
        amount: body.amount,
        providerId: body.providerId,
        provider: body?.provider,
        subscriptionStatus: body.subscriptionStatus,
        metaData: body.metaData,
        status: EStatus.Active,
        createdBy: token.id,
        updatedBy: token.id,
        externalId: body.externalId,
        transactionDetails: body.transactionDetails,
        currencyCode: body.currencyCode,
        currencyId: body.currencyId,
      };
      let subscription = await this.subscriptionModel.create(subscriptionData);
      return subscription;
    } catch (err) {
      throw err;
    }
  }

  async subscriptionComparision(token: UserToken) {
    try {
      let subscription = await this.subscriptionModel.findOne({
        userId: token.id,
      });

      let item = await this.itemService.getItemDetail(
        subscription?.notes?.itemId
      );

      return { subscription, item };
    } catch (err) {
      throw err;
    }
  }

  async addSubscription(body, token) {
    try {
      let subscriptionData = await this.validateSubscription(token.id, [
        EsubscriptionStatus.initiated,
        EsubscriptionStatus.failed,
      ]);
      let itemDetails = await this.itemService.getItemDetail(body.itemId);
      let subscriptionDetailsData = subscriptionData
        ? itemDetails?.additionalDetail?.promotionDetails?.subscriptionDetail
        : itemDetails?.additionalDetail?.promotionDetails?.authDetail;
      const now = new Date();
      let currentDate = now.toISOString();
      var duedate = new Date(now);
      subscriptionDetailsData.validityType == EvalidityType.day
        ? duedate.setDate(now.getDate() + subscriptionDetailsData.validity)
        : subscriptionDetailsData.validityType == EvalidityType.month
          ? duedate.setMonth(
              duedate.getMonth() + subscriptionDetailsData.validity
            )
          : duedate.setFullYear(
              duedate.getFullYear() + subscriptionDetailsData.validity
            );
      let fv = {
        userId: token.id,
        planId: itemDetails.additionalDetail.planId,
        currentStart: currentDate,
        currentEnd: duedate,
        endAt: duedate,
        expireBy: duedate,
        notes: {
          itemId: body.itemId,
          userId: token.id,
          amount: body.amount,
        },
        subscriptionStatus: Estatus.Active,
        status: EStatus.Active,
        createdBy: token.id,
        updatedBy: token.id,
      };
      let subscription = await this.subscriptionModel.create(fv);

      let userBody = {
        userId: token.id,
        membership: itemDetails?.itemName,
        badge: itemDetails?.additionalDetail?.badge,
      };

      await this.helperService.updateUser(userBody);
      return subscription;
    } catch (err) {
      throw err;
    }
  }

  @Cron("0 * * * *")
  async handleCron() {
    try {
      const now = new Date();
      let currentDate = now.toISOString();
      // console.log("updating subscription entries : " + currentDate);
      let expiredSubscriptionsList = await this.subscriptionModel.find({
        subscriptionStatus: EsubscriptionStatus.active,
        endAt: { $lte: currentDate },
        status: Estatus.Active,
      });
      let userIds = [];
      let badgeRemovalUserIds = await this.getExpiredSUbscriptionUserIds();
      expiredSubscriptionsList.map((data) => {
        userIds.push(data.userId);
      });

      if (expiredSubscriptionsList.length > 0) {
        await this.subscriptionModel.updateMany(
          {
            subscriptionStatus: EsubscriptionStatus.active,
            endAt: { $lte: currentDate },
            status: Estatus.Active,
          },
          { $set: { subscriptionStatus: EsubscriptionStatus.expired } }
        );
        for (let i in expiredSubscriptionsList) {
          let item = await this.itemService.getItemDetail(
            expiredSubscriptionsList[i]?.notes?.itemId
          );
          let mixPanelBody: any = {};
          mixPanelBody.eventName = EMixedPanelEvents.subscription_end;
          mixPanelBody.distinctId = expiredSubscriptionsList[i].userId;
          mixPanelBody.properties = {
            start_date: expiredSubscriptionsList[i].currentStart,
            end_date: expiredSubscriptionsList[i].endAt,
            subscription_id: expiredSubscriptionsList[i]._id,
            item_name: item?.itemName,
            user_id: expiredSubscriptionsList[i].userId,
          };
          await this.helperService.mixPanel(mixPanelBody);
        }

        // console.log(userIds);

        let updateBody = {
          userId: badgeRemovalUserIds,
          membership: "",
          badge: "",
        };
        // console.log(updateBody);
        await this.helperService.updateUsers(updateBody);
      }
    } catch (err) {
      throw err;
    }
  }
  async fetchSubscriptions(token: UserToken) {
    try {
      let filter = { userId: token.id, status: "Active" };
      let subscriptionData = await this.subscriptionModel
        .find(filter)
        .sort({ _id: -1 });
      let mandatesData = await this.mandateService.fetchMandates(token);
      let itemIds = subscriptionData
        .map((sub) => sub.notes?.itemId)
        .filter((id) => id);
      let itemNamesMap = await this.itemService.getItemNamesByIds(itemIds);
      let enhancedSubscriptions = [];
      for (let sub of subscriptionData) {
        enhancedSubscriptions.push({
          ...sub.toObject(),
          itemName: itemNamesMap[sub.notes?.itemId?.toString()],
        });
      }
      //console.log(enhancedSubscriptions);

      return { subscriptionData: enhancedSubscriptions, mandatesData };
    } catch (error) {
      throw error;
    }
  }
  async cancelSubscriptionStatus(
    token: UserToken,
    body: CancelSubscriptionBody
  ) {
    try {
      const mandates = await this.mandateService.getUserMandates(token.id);
      console.log("mandates is", mandates);

      if (!mandates?.length) {
        throw new HttpException(
          {
            code: HttpStatus.NOT_FOUND,
            message: "No active mandate found for the user",
          },
          HttpStatus.NOT_FOUND
        );
      }

      const mandate = mandates[0];
      const subRefId = mandate.metaData.subscription_id;
      let data;

      try {
        if (mandate.providerId === 2) {
          data = await this.helperService.cancelSubscription(subRefId);
        } else if (mandate.providerId === 1) {
          const userAdditionalData =
            await this.helperService.getUserAdditionalDetails({
              userId: token.id,
            });

          const tokenId = mandate.referenceId;
          const customerId = userAdditionalData?.userAdditional?.referenceId;

          if (!customerId || !tokenId) {
            throw new HttpException(
              {
                code: HttpStatus.BAD_REQUEST,
                message:
                  "Missing customer or token ID for Razorpay cancellation",
              },
              HttpStatus.BAD_REQUEST
            );
          }

          data = await this.helperService.cancelRazorpaySubscription(
            customerId,
            tokenId
          );
        } else {
          throw new HttpException(
            {
              code: HttpStatus.BAD_REQUEST,
              message: "Unsupported provider for cancellation",
            },
            HttpStatus.BAD_REQUEST
          );
        }
      } catch (err) {
        const statusCode =
          err?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
        const message =
          err?.response?.data?.error?.description ||
          err?.message ||
          "Subscription cancellation failed";

        throw new HttpException(
          {
            code: statusCode,
            message,
          },
          statusCode
        );
      }

      await this.mandateService.updateMandate(mandate._id, {
        cancelDate: new Date().toISOString(),
        cancelReason: body?.reason,
      });

      await this.mandateHistoryService.createMandateHistory({
        mandateId: mandate._id,
        mandateStatus: EMandateStatus.cancelled,
        status: EStatus.Active,
        createdBy: token.id,
        updatedBy: token.id,
      });

      return {
        subRefId,
        status: "Subscription cancelled",
        subscriptionId: data?.subscription_id,
        subscriptionStatus: data?.subscription_status,
      };
    } catch (error) {
      const statusCode =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      const message =
        error instanceof HttpException
          ? (error.getResponse() as any)?.message
          : error?.message || "Internal Server Error";

      // console.error("Error in cancelSubscriptionStatus:", error);

      throw new HttpException(
        {
          code: statusCode,
          message,
        },
        statusCode
      );
    }
  }
  // @Cron("*/20 * * * * *")

  @Cron("0 1 * * *")
  async createCharge() {
    const lockKey = 'createCharge:lock';
    const lockTimeout = 30 * 60 * 1000; // 30 minutes
    let lockAcquired = false;
    
    try {
      // Acquire distributed lock to prevent concurrent executions
      lockAcquired = await this.acquireDistributedLock(lockKey, lockTimeout);
      if (!lockAcquired) {
        console.log('createCharge: Another instance is already running, skipping execution');
        return;
      }

      console.log('createCharge: Starting optimized charge creation process');
      const startTime = Date.now();
      
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      // Enhanced aggregation with duplicate prevention
      let expiringSubscriptionsList = await this.subscriptionModel.aggregate([
        {
          $sort: {
            _id: -1,
          },
        },
        {
          $group: {
            _id: "$userId",
            latestDocument: { $first: "$$ROOT" },
          },
        },
        {
          $match: {
            "latestDocument.subscriptionStatus": {
              $ne: EsubscriptionStatus.initiated,
            },
          },
        },
        {
          $match: {
            $or: [
              {
                "latestDocument.subscriptionStatus": {
                  $in: [
                    EsubscriptionStatus.failed,
                    EsubscriptionStatus.expired,
                  ],
                },
                "latestDocument.status": EStatus.Active,
              },
              {
                $and: [
                  {
                    "latestDocument.subscriptionStatus":
                      EsubscriptionStatus.active,
                  },
                  { "latestDocument.endAt": { $lte: tomorrow } },
                ],
              },
            ],
          },
        },
        {
          $lookup: {
            from: "mandates",
            localField: "latestDocument.userId",
            foreignField: "userId",
            as: "mandates",
          },
        },
        {
          $unwind: {
            path: "$mandates",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: {
            "mandates._id": -1,
          },
        },
        {
          $match: {
            "mandates.mandateStatus": {
              $in: [EMandateStatus.active, EMandateStatus.bankPendingApproval],
            },
          },
        },
        {
          $group: {
            _id: "$_id",
            latestDocument: { $first: "$latestDocument" },
            latestMandate: { $first: "$mandates" },
          },
        },
      ]);

      console.log(`createCharge: Found ${expiringSubscriptionsList.length} expiring subscriptions`);

      if (expiringSubscriptionsList.length === 0) {
        console.log('createCharge: No expiring subscriptions found, exiting');
        return;
      }

      // Deduplication: Check for existing pending charges
      const userIds = expiringSubscriptionsList.map(sub => sub.latestDocument.userId);
      const existingCharges = await this.subscriptionModel.find({
        userId: { $in: userIds },
        subscriptionStatus: EsubscriptionStatus.initiated,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }).select('userId').lean();

      const existingChargeUserIds = new Set(existingCharges.map(charge => charge.userId.toString()));
      const filteredSubscriptions = expiringSubscriptionsList.filter(
        sub => !existingChargeUserIds.has(sub.latestDocument.userId.toString())
      );

      console.log(`createCharge: After deduplication, processing ${filteredSubscriptions.length} subscriptions`);

      if (filteredSubscriptions.length === 0) {
        console.log('createCharge: All subscriptions already have pending charges, exiting');
        return;
      }

      // Batch processing with error handling
      const results = await this.processSubscriptionsBatch(filteredSubscriptions);
      
      const executionTime = Date.now() - startTime;
      console.log(`createCharge: Completed in ${executionTime}ms. Success: ${results.success}, Failed: ${results.failed}`);
      
      // Log failed subscriptions for manual review
      if (results.failedSubscriptions.length > 0) {
        console.error('createCharge: Failed subscriptions:', results.failedSubscriptions);
      }

    } catch (error) {
      console.error('createCharge: Critical error occurred:', error);
      throw error;
    } finally {
      // Always release the lock
      if (lockAcquired) {
        await this.releaseDistributedLock(lockKey);
      }
    }
  }

  private async acquireDistributedLock(key: string, timeout: number): Promise<boolean> {
    try {
      // Using Redis for distributed locking
      const lockValue = `${Date.now()}-${Math.random()}`;
      const result = await this.redisService.setNX(key, lockValue, timeout);
      return result === 'OK';
    } catch (error) {
      console.error('Failed to acquire distributed lock:', error);
      return false;
    }
  }

  private async releaseDistributedLock(key: string): Promise<void> {
    try {
      await this.redisService.del(key);
    } catch (error) {
      console.error('Failed to release distributed lock:', error);
    }
  }

  private async processSubscriptionsBatch(subscriptions: any[]): Promise<{
    success: number;
    failed: number;
    failedSubscriptions: any[];
  }> {
    const results = {
      success: 0,
      failed: 0,
      failedSubscriptions: []
    };

    // Collect all unique itemIds and fetch them in batch for better performance
    const itemIds = new Set();
    const subscriptionsWithItemIds = [];
    const subscriptionsWithoutItemIds = [];
    
    for (const subscription of subscriptions) {
      const itemId = subscription?.latestDocument?.notes?.itemId;
      if (itemId) {
        itemIds.add(itemId);
        subscriptionsWithItemIds.push({
          subscription: subscription,
          itemId: itemId
        });
      } else {
        subscriptionsWithoutItemIds.push(subscription);
      }
    }
    
    // Batch fetch all item details at once
    let itemDetailsMap = new Map();
    if (itemIds.size > 0) {
      try {
        const itemDetails = await this.itemService.getItemsDetails(Array.from(itemIds));
        itemDetails.forEach(item => {
          itemDetailsMap.set(item._id.toString(), item);
        });
      } catch (error) {
        console.error('Failed to fetch item details:', error);
        // Continue with PRO plan fallback
      }
    }
    
    // Get PRO plan detail once for fallback
    let proPlanDetail = null;
    try {
      proPlanDetail = await this.itemService.getItemDetailByName("PRO");
    } catch (error) {
      console.error('Failed to fetch PRO plan details:', error);
    }

    // Process subscriptions with itemIds
    for (const { subscription, itemId } of subscriptionsWithItemIds) {
      try {
        const mandate = subscription?.latestMandate;
        const planDetail = itemDetailsMap.get(itemId) || proPlanDetail;
        
        if (!planDetail) {
          throw new Error('No plan detail available');
        }

        if (mandate?.providerId == EProviderId.cashfree) {
          await this.createChargeDataWithRetry(subscription, planDetail);
        } else if (mandate?.providerId == EProviderId.razorpay) {
          await this.raiseChargeWithRetry(subscription, planDetail);
        }
        
        results.success++;
      } catch (error) {
        console.error(`Failed to process subscription for user ${subscription?.latestDocument?.userId}:`, error);
        results.failed++;
        results.failedSubscriptions.push({
          subscription,
          error: error.message
        });
      }
    }
    
    // Process subscriptions without itemIds (use PRO plan)
    for (const subscription of subscriptionsWithoutItemIds) {
      try {
        const mandate = subscription?.latestMandate;
        
        if (!proPlanDetail) {
          throw new Error('PRO plan detail not available');
        }

        if (mandate?.providerId == EProviderId.cashfree) {
          await this.createChargeDataWithRetry(subscription, proPlanDetail);
        } else if (mandate?.providerId == EProviderId.razorpay) {
          await this.raiseChargeWithRetry(subscription, proPlanDetail);
        }
        
        results.success++;
      } catch (error) {
        console.error(`Failed to process subscription for user ${subscription?.latestDocument?.userId}:`, error);
        results.failed++;
        results.failedSubscriptions.push({
          subscription,
          error: error.message
        });
      }
    }

    return results;
  }

  private async createChargeDataWithRetry(subscriptionData: any, planDetail: any, maxRetries: number = 3): Promise<void> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.createChargeData(subscriptionData, planDetail);
        return; // Success
      } catch (error) {
        lastError = error;
        console.warn(`createChargeData attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  private async raiseChargeWithRetry(subscriptionData: any, planDetail: any, maxRetries: number = 3): Promise<void> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.raiseCharge(subscriptionData, planDetail);
        return; // Success
      } catch (error) {
        lastError = error;
        console.warn(`raiseCharge attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  async createChargeData(subscriptionData, planDetail) {
    try {
      // Validate input data before processing
      const validationResult = this.validateChargeDataInput(subscriptionData, planDetail);
      if (!validationResult.isValid) {
        throw new Error(`Invalid charge data: ${validationResult.errors.join(', ')}`);
      }

      // Extract and cache commonly used values to avoid repeated property access
      const subscriptionDoc = subscriptionData?.latestDocument;
      const subscriptionDetail = planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail;
      const userId = subscriptionDoc?.userId;
      const itemId = subscriptionDoc?.notes?.itemId;

      // Generate unique payment ID with idempotency key
      const paymentSequence = await this.sharedService.getNextNumber(
        "cashfree-payment",
        "CSH-PMT",
        5,
        null
      );
      const paymentNewNumber = paymentSequence.toString().padStart(5, "0");
      const idempotencyKey = `${userId}-${itemId}-${Date.now()}`;
      const paymentNumber = `${paymentNewNumber}-${idempotencyKey}`;

      // Calculate dates once
      const now = new Date();
      const paymentSchedule = new Date(now.getTime() + 26 * 60 * 60 * 1000);
      const today = new Date();
      const startAt = new Date();
      startAt.setDate(today.getDate() + 1);
      startAt.setHours(18, 30, 0, 0);

      // Calculate end date based on validity type
      const endAt = this.calculateSubscriptionEndDate(now, subscriptionDetail);

      // Build auth body with validation
      const authBody = {
        subscription_id: subscriptionDoc?.metaData?.subscription_id,
        payment_id: paymentNumber,
        payment_amount: subscriptionDetail?.amount,
        payment_type: "CHARGE",
        payment_schedule_date: paymentSchedule.toISOString(),
        idempotency_key: idempotencyKey, // Add idempotency key
      };

      // Validate auth body before API call
      this.validateAuthBody(authBody);

      // Make API call to create charge
      const chargeResponse = await this.helperService.createAuth(authBody);

      if (!chargeResponse) {
        throw new Error('Failed to create charge with Cashfree');
      }

      // Create subscription record
      const subscriptionRecord = {
        userId: userId,
        planId: subscriptionDoc?.planId,
        startAt: startAt,
        amount: subscriptionDetail?.amount,
        providerId: 2,
        endAt: endAt,
        metaData: {
          subscription_id: subscriptionDoc?.metaData?.subscription_id,
          cf_subscription_id: subscriptionDoc?.metaData?.cf_subscription_id,
          customer_details: subscriptionDoc?.metaData?.customer_details,
          idempotency_key: idempotencyKey,
        },
        notes: {
          itemId: itemId,
          amount: subscriptionDetail?.amount,
          paymentScheduledAt: paymentSchedule,
          paymentId: paymentNumber,
          idempotencyKey: idempotencyKey,
        },
        subscriptionStatus: EsubscriptionStatus.initiated,
        status: EStatus.Active,
        createdBy: userId,
        updatedBy: userId,
      };

      const subscription = await this.subscriptionModel.create(subscriptionRecord);

      // Create invoice
      const invoiceData = {
        itemId: itemId,
        source_id: subscription._id,
        source_type: "subscription",
        sub_total: subscriptionDetail?.amount,
        currencyCode: "INR",
        document_status: EDocumentStatus.pending,
        grand_total: subscriptionDetail?.amount,
        user_id: userId,
        created_by: userId,
        updated_by: userId,
      };

      const invoice = await this.invoiceService.createInvoice(
        invoiceData,
        userId
      );

      // Create payment record
      const paymentData = {
        amount: subscriptionDetail?.amount,
        currencyCode: "INR",
        source_id: invoice._id,
        source_type: EPaymentSourceType.invoice,
        userId: userId,
        document_status: EDocumentStatus.pending,
        paymentType: EPaymentType.charge,
        providerId: 2,
        providerName: EProvider.cashfree,
        transactionDate: paymentSchedule,
        idempotencyKey: idempotencyKey,
      };

      await this.paymentService.createPaymentRecord(
        paymentData,
        null,
        invoice,
        "INR",
        { order_id: chargeResponse?.cf_payment_id }
      );

      // Send analytics event (non-blocking)
      this.sendSubscriptionAnalytics(subscription, invoice, userId, itemId);

      return {
        success: true,
        subscriptionId: subscription._id,
        paymentId: paymentNumber,
        idempotencyKey: idempotencyKey,
      };

    } catch (error) {
      console.error('createChargeData failed:', error);
      throw error;
    }
  }

  private validateChargeDataInput(subscriptionData: any, planDetail: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!subscriptionData?.latestDocument) {
      errors.push('Missing subscription document');
    }

    if (!planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail) {
      errors.push('Missing subscription detail in plan');
    }

    if (!subscriptionData?.latestDocument?.userId) {
      errors.push('Missing user ID');
    }

    if (!subscriptionData?.latestDocument?.metaData?.subscription_id) {
      errors.push('Missing subscription ID in metadata');
    }

    const amount = planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail?.amount;
    if (!amount || amount <= 0) {
      errors.push('Invalid subscription amount');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateAuthBody(authBody: any): void {
    const requiredFields = ['subscription_id', 'payment_id', 'payment_amount', 'payment_type'];
    
    for (const field of requiredFields) {
      if (!authBody[field]) {
        throw new Error(`Missing required field in auth body: ${field}`);
      }
    }

    if (authBody.payment_amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }
  }

  private calculateSubscriptionEndDate(startDate: Date, subscriptionDetail: any): Date {
    const endAt = new Date(startDate);
    const validityType = subscriptionDetail?.validityType;
    const validity = subscriptionDetail?.validity;

    if (!validityType || !validity) {
      throw new Error('Invalid subscription validity configuration');
    }

    switch (validityType) {
      case EvalidityType.day:
        endAt.setDate(endAt.getDate() + validity);
        break;
      case EvalidityType.month:
        endAt.setMonth(endAt.getMonth() + validity);
        break;
      case EvalidityType.year:
        endAt.setFullYear(endAt.getFullYear() + validity);
        break;
      default:
        throw new Error(`Unsupported validity type: ${validityType}`);
    }

    endAt.setHours(18, 29, 59, 999);
    return endAt;
  }

  private async sendSubscriptionAnalytics(subscription: any, invoice: any, userId: string, itemId: string): Promise<void> {
    try {
      // Run analytics in background to avoid blocking the main flow
      setImmediate(async () => {
        try {
          const [item, subscriptionCount] = await Promise.all([
            this.itemService.getItemDetail(itemId),
            this.countUserSubscriptions(userId)
          ]);

          const mixPanelBody = {
            eventName: EMixedPanelEvents.subscription_add,
            distinctId: userId,
            properties: {
              user_id: userId,
              provider: subscription?.provider,
              subscription_id: subscription?._id,
              subscription_status: EsubscriptionStatus.active,
              subscription_date: subscription?.startAt,
              item_name: item?.itemName,
              subscription_expired: subscription?.endAt,
              subscription_count: subscriptionCount,
              subscription_mode: ESubscriptionMode.Charge,
              subscription_amount: invoice.grand_total
            }
          };

          await this.helperService.mixPanel(mixPanelBody);
        } catch (error) {
          console.error('Analytics sending failed (non-blocking):', error);
        }
      });
    } catch (error) {
      console.error('Failed to schedule analytics:', error);
    }
  }

  async raiseCharge(subscriptionData, planDetail) {
    try {
      // Validate input data before processing
      const validationResult = this.validateRazorpayChargeInput(subscriptionData, planDetail);
      if (!validationResult.isValid) {
        throw new Error(`Invalid Razorpay charge data: ${validationResult.errors.join(', ')}`);
      }

      // Extract and cache commonly used values
      const subscriptionDoc = subscriptionData?.latestDocument;
      const subscriptionDetail = planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail;
      const userId = subscriptionDoc?.userId;
      const itemId = subscriptionDoc?.notes?.itemId;
      const mandate = subscriptionData?.latestMandate;

      // Generate unique payment ID with idempotency key
      const paymentSequence = await this.sharedService.getNextNumber(
        "razorpay-payment",
        "RZP-PMT",
        5,
        null
      );
      const paymentNewNumber = paymentSequence.toString().padStart(5, "0");
      const idempotencyKey = `${userId}-${itemId}-${Date.now()}`;
      const paymentNumber = `${paymentNewNumber}-${idempotencyKey}`;

      // Calculate dates once
      const now = new Date();
      const paymentSchedule = new Date(now.getTime() + 26 * 60 * 60 * 1000);
      const today = new Date();
      const startAt = new Date();
      startAt.setDate(today.getDate() + 1);
      startAt.setHours(18, 30, 0, 0);

      // Calculate end date using shared method
      const endAt = this.calculateSubscriptionEndDate(now, subscriptionDetail);

      // Fetch user data with timeout
      const userAdditionalData = await this.helperService.getUserAdditionalDetails({
        userId: userId,
      });

      if (!userAdditionalData?.userAdditional?.referenceId) {
        throw new Error('User reference ID not found');
      }

      const customerId = userAdditionalData.userAdditional.referenceId;
      const subscriptionAmount = subscriptionDetail.amount * 100; // Convert to paise
      const paymentScheduleInSeconds = Math.floor(paymentSchedule.getTime() / 1000);

      // Build auth body with idempotency
      const authBody = {
        amount: subscriptionAmount,
        currency: "INR",
        customer_id: customerId,
        payment_capture: true,
        token: {
          max_amount: subscriptionAmount,
          expire_at: paymentScheduleInSeconds,
        },
        notification: {
          token_id: mandate?.referenceId,
          payment_after: paymentScheduleInSeconds,
        },
        notes: {
          mandateId: mandate?.referenceId,
          userId: userId,
          subscriptionId: subscriptionDoc?.subscriptionId,
          idempotencyKey: idempotencyKey,
        },
        idempotency_key: idempotencyKey, // Add idempotency key
      };

      // Validate auth body
      this.validateRazorpayAuthBody(authBody);

      // Make API call to create subscription with retry
      const chargeResponse = await this.retryApiCall(
        () => this.helperService.addSubscription(authBody),
        'Razorpay addSubscription'
      );

      if (!chargeResponse?.id) {
        throw new Error('Failed to create Razorpay subscription');
      }

      // Build recurring payment data
      const recurring = {
        email: userAdditionalData?.userAdditional?.userId?.emailId ||
               `${userAdditionalData?.userAdditional?.userId?.phoneNumber}@casttree.com`,
        contact: userAdditionalData?.userAdditional?.userId?.phoneNumber,
        amount: subscriptionAmount,
        currency: "INR",
        order_id: chargeResponse.id,
        customer_id: customerId,
        token: mandate?.referenceId,
        recurring: "1",
        notes: {
          userId: userId,
          userReferenceId: customerId,
          razorpayOrderId: chargeResponse.id,
          idempotencyKey: idempotencyKey,
        },
        idempotency_key: idempotencyKey, // Add idempotency key
      };

      // Create recurring payment with retry
      const recurringResponse = await this.retryApiCall(
        () => this.helperService.createRecurringPayment(recurring),
        'Razorpay createRecurringPayment'
      );

      if (!recurringResponse) {
        throw new Error('Failed to create Razorpay recurring payment');
      }

      // Generate subscription ID
      const razorpaySubscriptionSequence = await this.sharedService.getNextNumber(
        "razorpay-subscription",
        "RZP-SUB",
        5,
        null
      );
      const razorpaySubscriptionNumber = razorpaySubscriptionSequence.toString().padStart(5, "0");

      // Create subscription record
      const subscriptionRecord = {
        userId: userId,
        subscriptionId: razorpaySubscriptionNumber,
        startAt: startAt,
        amount: subscriptionDetail.amount,
        providerId: 1,
        provider: EProvider.razorpay,
        endAt: endAt,
        metaData: {
          subscription_id: subscriptionDoc?.metaData?.subscriptionId,
          idempotency_key: idempotencyKey,
          ...chargeResponse,
        },
        currencyCode: "INR",
        notes: {
          itemId: itemId,
          amount: subscriptionAmount,
          paymentScheduledAt: paymentSchedule,
          paymentId: paymentNumber,
          idempotencyKey: idempotencyKey,
        },
        subscriptionStatus: EsubscriptionStatus.initiated,
        status: EStatus.Active,
        createdBy: userId,
        updatedBy: userId,
      };

      const subscription = await this.subscriptionModel.create(subscriptionRecord);

      // Create invoice
      const invoiceData = {
        itemId: itemId,
        source_id: subscription._id,
        source_type: "subscription",
        sub_total: subscriptionDetail.amount,
        currencyCode: "INR",
        document_status: EDocumentStatus.pending,
        grand_total: subscriptionDetail.amount,
        user_id: userId,
        created_by: userId,
        updated_by: userId,
      };

      const invoice = await this.invoiceService.createInvoice(invoiceData, userId);

      // Create payment record
      const paymentData = {
        amount: subscriptionDetail.amount,
        currencyCode: "INR",
        source_id: invoice._id,
        source_type: EPaymentSourceType.invoice,
        userId: userId,
        document_status: EDocumentStatus.pending,
        paymentType: EPaymentType.charge,
        providerId: 1,
        providerName: EProvider.razorpay,
        transactionDate: paymentSchedule,
        idempotencyKey: idempotencyKey,
        metaData: {
          response: {
            chargeResponse,
            recurringResponse,
          },
        },
      };

      await this.paymentService.createPaymentRecord(
        paymentData,
        null,
        invoice,
        "INR",
        { order_id: chargeResponse.id }
      );

      // Send analytics event (non-blocking)
      this.sendRazorpaySubscriptionAnalytics(subscription, invoice, userId, itemId);

      return {
        success: true,
        subscriptionId: subscription._id,
        paymentId: paymentNumber,
        idempotencyKey: idempotencyKey,
        razorpayOrderId: chargeResponse.id,
      };

    } catch (error) {
      console.error('raiseCharge failed:', error);
      throw error;
    }
  }

  private validateRazorpayChargeInput(subscriptionData: any, planDetail: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!subscriptionData?.latestDocument) {
      errors.push('Missing subscription document');
    }

    if (!subscriptionData?.latestMandate?.referenceId) {
      errors.push('Missing mandate reference ID');
    }

    if (!planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail) {
      errors.push('Missing subscription detail in plan');
    }

    if (!subscriptionData?.latestDocument?.userId) {
      errors.push('Missing user ID');
    }

    const amount = planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail?.amount;
    if (!amount || amount <= 0) {
      errors.push('Invalid subscription amount');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateRazorpayAuthBody(authBody: any): void {
    const requiredFields = ['amount', 'currency', 'customer_id', 'token', 'notification'];
    
    for (const field of requiredFields) {
      if (!authBody[field]) {
        throw new Error(`Missing required field in Razorpay auth body: ${field}`);
      }
    }

    if (authBody.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (!authBody.token.max_amount || authBody.token.max_amount <= 0) {
      throw new Error('Token max amount must be greater than 0');
    }
  }

  private async retryApiCall<T>(
    apiCall: () => Promise<T>,
    operationName: string,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        console.warn(`${operationName} attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const baseDelay = Math.pow(2, attempt) * 1000;
          const jitter = Math.random() * 1000;
          const delay = baseDelay + jitter;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`${operationName} failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  private async sendRazorpaySubscriptionAnalytics(subscription: any, invoice: any, userId: string, itemId: string): Promise<void> {
    try {
      // Run analytics in background to avoid blocking the main flow
      setImmediate(async () => {
        try {
          const [item, subscriptionCount] = await Promise.all([
            this.itemService.getItemDetail(itemId),
            this.countUserSubscriptions(userId)
          ]);

          const mixPanelBody = {
            eventName: EMixedPanelEvents.subscription_add,
            distinctId: userId,
            properties: {
              user_id: userId,
              provider: subscription?.provider,
              subscription_id: subscription?._id,
              subscription_status: EsubscriptionStatus.active,
              subscription_date: subscription?.startAt,
              item_name: item?.itemName,
              subscription_expired: subscription?.endAt,
              subscription_count: subscriptionCount,
              subscription_mode: ESubscriptionMode.Charge,
              subscription_amount: invoice.grand_total
            }
          };

          await this.helperService.mixPanel(mixPanelBody);
        } catch (error) {
          console.error('Razorpay analytics sending failed (non-blocking):', error);
        }
      });
    } catch (error) {
      console.error('Failed to schedule Razorpay analytics:', error);
    }
  }

  async updatePaymentRecords(paymentId: string, body: UpdatePaymentBody) {
    try {
      //  console.log("update payment records ==>", body);

      let payment = await this.paymentService.fetchPaymentByOrderId(paymentId);
      await this.invoiceService.updateInvoice(
        payment.source_id,
        body.document_status
      );
      await this.paymentService.updateStatus(paymentId, body);
      return { message: "Success" };
    } catch (err) {
      throw err;
    }
  }
  async findAppleExternalId(originalTransactionId, transactionId, userId) {
    try {
      let data = await this.subscriptionModel.findOne({
        "transactionDetails.transactionId": transactionId,
        "transactionDetails.originalTransactionId": originalTransactionId,
        providerId: EProviderId.apple,
        provider: EProvider.apple,
        status: EStatus.Active,
        userId: userId,
      });
      console.log("data", data);

      return data;
    } catch (error) {
      throw error;
    }
  }
  async findGoogleExternalId(transactionId) {
    try {
      let externalIdData = await this.subscriptionModel.findOne({
        externalId: transactionId,
        providerId: EProviderId.google,
        provider: EProvider.google,
        status: EStatus.Active,
      });
      return externalIdData;
    } catch (error) {
      throw error;
    }
  }
  // async findMetaDataExternalId(transactionId) {
  //   try {
  //     let externalIdData = await this.subscriptionModel.findOne({
  //       "metaData.externalId": transactionId,
  //       providerId: { $in: [EProviderId.google] },
  //       // provider: EProvider.apple,
  //     });
  //     return externalIdData;
  //   } catch (error) {
  //     throw error;
  //   }
  // }
  async getExpiredSUbscriptionUserIds() {
    const currentDate = new Date();
    let ExpiredData = await this.subscriptionModel.aggregate([
      {
        $match: {
          subscriptionStatus: "Active",
          status: "Active",
          endAt: { $lte: currentDate },
        },
      },
      {
        $lookup: {
          from: "salesDocument",
          localField: "_id",
          foreignField: "source_id",
          as: "salesDoc",
        },
      },
      {
        $unwind: {
          path: "$salesDoc",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "itemDocument",
          localField: "salesDoc._id",
          foreignField: "source_id",
          as: "itemDoc",
        },
      },
      {
        $unwind: {
          path: "$itemDoc",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          endAt: 1,
          item_id: "$itemDoc.item_id",
        },
      },
    ]);
    let expiredUserId = [];
    ExpiredData.map((data) => {
      expiredUserId.push(data.userId);
    });

    let renewalData = await this.subscriptionModel.aggregate([
      {
        $match: {
          subscriptionStatus: "Active",
          status: "Active",
          endAt: { $gt: currentDate },
          userId: { $in: expiredUserId },
        },
      },
      {
        $lookup: {
          from: "salesDocument",
          localField: "_id",
          foreignField: "source_id",
          as: "salesDoc",
        },
      },
      {
        $unwind: {
          path: "$salesDoc",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "itemDocument",
          localField: "salesDoc._id",
          foreignField: "source_id",
          as: "itemDoc",
        },
      },
      {
        $unwind: {
          path: "$itemDoc",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          endAt: 1,
          item_id: "$itemDoc.item_id",
        },
      },
    ]);
    for (const expired of ExpiredData) {
      const exists = renewalData.some(
        (r) =>
          r.item_id.toString() === expired?.item_id?.toString() &&
          r.userId.toString() === expired?.userId?.toString()
      );
      if (exists) {
        expiredUserId = expiredUserId.filter((item) => item !== expired.userId);
      }
    }
    return expiredUserId;
  }

  async checkEligibility(token: UserToken, itemId: string) {
    try {
      const activeSubscription = await this.subscriptionModel.findOne({
        userId: token.id,
        subscriptionStatus: "Active",
      });
      if (!activeSubscription) {
        return {
          isEligible: false,
          reason: SUBSCRIPTION_NOT_FOUND,
        };
      }
      let userItemId = activeSubscription?.notes?.itemId;
      const serviceItemTypeList =
        await this.serviceItemService.getServiceItemType(userItemId);
      let isEligible = false;
      if (activeSubscription && serviceItemTypeList.type === "subscription") {
        const config = await this.helperService.getSystemConfig(itemId);
        const eligibilityList = config?.data?.eligibility;
        isEligible = Array.isArray(eligibilityList)
          ? eligibilityList.some(
              (e) => e._id.toString() === userItemId.toString()
            )
          : false;
      }
      return {
        isEligible: isEligible,
        reason: isEligible ? ELIGIBLE_SUBSCRIPTION : NOT_ELIGIBLE_SUBSCRIPTION,
      };
    } catch (error) {
      throw error;
    }
  }
  async findOriginalTransactionId(originalTransactionId: string) {
    try {
      let filter = {
        "transactionDetails.originalTransactionId": originalTransactionId,
      };
      let subscriptionData = await this.subscriptionModel
        .findOne(filter)
        .lean();
      // console.log("subscriptionData", subscriptionData);
      return subscriptionData;
    } catch (error) {
      throw error;
    }
  }

  async updateSubscription(body) {
    try {
      let data = await this.subscriptionModel.findOneAndUpdate(
        {
          _id: body._id,
          subscriptionStatus: EsubscriptionStatus.initiated,
          status: EStatus.Active,
          providerId: { $in: [EProviderId.apple, EProviderId.google] },
        },
        {
          $set: {
            subscriptionStatus: EsubscriptionStatus.active,
            metaData: body?.metaData,
            endAt: new Date(body?.expiresDate) || body?.expiresDate,
          },
        }
      );
      return data;
    } catch (error) {
      throw error;
    }
  }
  async handleIapCoinTransactions(body,token){
    try {
      let transaction = await this.subscriptionFactory.handleIapCoinPurchase(body,token)
      return transaction
    } catch (error) {
      throw error
    }
  }
  async getLatestSubscription(token: UserToken) {
    try {
      let subscription = await this.subscriptionModel.findOne({
        userId: new ObjectId(token.id),
        status: EStatus.Active,
        subscriptionStatus: { $nin: [EsubscriptionStatus.initiated, EsubscriptionStatus.failed] }
      }).sort({_id: -1}).lean()

      if(!subscription){
        throw new HttpException(
         {message: EErrorHandler.notFound},
          HttpStatus.NOT_FOUND
        );
      }
      return { data: subscription }
    } catch (error) {
      throw error
    }
  }
  @OnEvent(EVENT_UPDATE_REFERRAL_STATUS)
  async handleUpdateReferralStatus(payload: any) {
    try {
      await this.updateReferralStatus(payload);

      await this.sharedService.updateEventProcessingStatus(
        payload?.commandSource,
        ECommandProcessingStatus.Complete
      );
    } catch (error) {
      await this.sharedService.updateEventProcessingStatus(
        payload?.commandSource,
        ECommandProcessingStatus.Failed
      );
      throw error
    }
  }
  async updateReferralStatus(payload: any) {
    try {
      let userAdditional = await this.helperService.getUserAdditional(payload?.userId)
      let referelData = await this.helperService.getReferralData(payload?.userId,userAdditional?.referredBy)

      const subscription = await this.subscriptionModel.findOne({
        _id:  new ObjectId(payload?.subscriptionId),
        userId: new ObjectId(payload?.userId),
        status: EStatus.Active, 
        subscriptionStatus: EsubscriptionStatus.active
      }).lean()
      if(referelData?.referralStatus === EReferralStatus.Onboarded && subscription?.subscriptionStatus === EsubscriptionStatus.active){
        let body = {
          refereeUserId: referelData?.refereeUserId,
          referralId : referelData?._id,
          referrerId: referelData?.referrerUserId,
        }
        await this.helperService.updateReferral(body)
      }
    } catch (error) {
      throw error
    }
  }
  
  async countUserSubscriptions(userId: string): Promise<number> {
    try {
      const count = await this.subscriptionModel.countDocuments({
        userId: new ObjectId(userId),
        subscriptionStatus: { $in: [EsubscriptionStatus.active, EsubscriptionStatus.expired] },
        status: EStatus.Active
      });
      return count;
    } catch (error) {
      throw error;
    }
  }
  async userFirstSubscription(userId: string) {
    try {
      let filter = {
        userId: new ObjectId(userId),
        status: EStatus.Active,
        subscriptionStatus: { $in: [EsubscriptionStatus.active, EsubscriptionStatus.expired] }
      };
      let data = await this.subscriptionModel.findOne(filter).sort({createdAt: 1}).lean();
      return data
    } catch (error) {
      throw error;
    }
  }
}
