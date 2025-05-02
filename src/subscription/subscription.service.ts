import { Injectable, Req } from "@nestjs/common";
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
import { EEventId, EEventType } from "./enums/eventType.enum";
import {
  EPaymentSourceType,
  EPaymentStatus,
  EPaymentType,
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
  RazorpaySubscriptionPayload,
  SubscriptionData,
  UpdatePaymentBody,
  UserUpdateData,
} from "./dto/subscription.dto";
import { EProvider, EProviderId } from "./enums/provider.enum";
import { EsubscriptionStatus } from "./enums/subscriptionStatus.enum";
import { EvalidityType } from "./enums/validityType.enum";
import { ISubscriptionModel } from "./schema/subscription.schema";
import { SubscriptionFactory } from "./subscription.factory";
// var ObjectId = require("mongodb").ObjectID;
const { ObjectId } = require("mongodb");

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel("subscription")
    private readonly subscriptionModel: Model<ISubscriptionModel>,
    private readonly subscriptionFactory: SubscriptionFactory,
    private invoiceService: InvoiceService,
    private paymentService: PaymentRequestService,
    private helperService: HelperService,
    private sharedService: SharedService,
    private itemService: ItemService,
    private readonly mandateService: MandatesService,
    private readonly mandateHistoryService: MandateHistoryService
  ) {}

  async createSubscription(body: CreateSubscriptionDTO, token) {
    try {
      let subscriptionData;
      switch (body.provider) {
        case "razorpay":
          let item = await this.itemService.getItemDetail(body.itemId);
          let authAmount = item?.additionalDetail?.authDetail?.amount;
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
          let chargeDate =
            item?.additionalDetail?.authDetail?.validityType === "day"
              ? this.sharedService.getFutureDateISO(
                  item?.additionalDetail?.authDetail?.validity
                )
              : item?.additionalDetail?.authDetail?.validityType === "month"
                ? this.sharedService.getFutureMonthISO(
                    item?.additionalDetail?.authDetail?.validity
                  )
                : item?.additionalDetail?.authDetail?.validityType === "year"
                  ? this.sharedService.getFutureYearISO(
                      item?.additionalDetail?.authDetail?.validity
                    )
                  : null;
          let razorpaySubscriptionNewNumber = `${razorpaySubscriptionNumber}-${Date.now()}`;
          subscriptionData = {
            subscription_id: razorpaySubscriptionNewNumber.toString(),
            amount: authAmount * 100,
            authAmount: authAmount,
            currency: item?.additionalDetail?.authDetail?.currency_code,
            method: "upi",
            subscriptionAmount:
              item?.additionalDetail?.subscriptionDetail?.amount,
            maximumAmount: item?.additionalDetail?.subscriptionDetail?.amount,
            token: {
              max_amount:
                item?.additionalDetail?.subscriptionDetail?.amount * 100,
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
          let endDate = this.sharedService.getFutureMonthISO(1);
          subscriptionData = {
            userId: token?.id,
            planId: body?.planId,
            providerId: EProviderId.apple,
            provider: EProvider.apple,
            startAt: new Date(),
            endAt: endDate,
            subscriptionStatus: EsubscriptionStatus.initiated,
            notes: { itemId: body?.itemId },
            amount: body?.authAmount,
            status: EStatus.Active,
            createdBy: token?.id,
            updatedBy: token?.id,
            metaData: {
              externalId: body?.transactionDetails?.externalId,
            },
          };
          break;
        case EProvider.google:
          let endAt = this.sharedService.getFutureMonthISO(1);
          subscriptionData = {
            userId: token?.id,
            planId: body?.planId,
            providerId: EProviderId.google,
            provider: EProvider.google,
            startAt: new Date(),
            endAt: endAt,
            subscriptionStatus: EsubscriptionStatus.initiated,
            notes: { itemId: body?.itemId },
            amount: body?.authAmount,
            status: EStatus.Active,
            createdBy: token?.id,
            updatedBy: token?.id,
            metaData: {
              externalId: body?.transactionDetails?.externalId,
            },
          };
          break;
        default:
          throw new Error(`Unsupported provider: ${body.provider}`);
      }

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
  async subscriptionWebhook(@Req() req, providerId: number) {
    try {
      console.log(providerId);
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
        // console.log("inside razorpay webhook", req?.body);
        // if (event === EEventType.tokenCancelled) {
        //   const payload = req?.body?.payload;
        //   await this.handleRazorpayMandate(payload);
        // }
        if (
          event === EEventType.paymentAuthorized &&
          event === EEventType.tokenConfirmed
        ) {
          const payload = req?.body?.payload;
          console.log("inside payment authorized", payload);
          await this.handleRazorpaySubscriptionPayment(payload);
          // await this.handleRazorpaySubscription(payload);
        }
        if (event === EEventType.paymentFailed) {
          const payload = req?.body?.payload;
          console.log("inside payment failed", payload);
          await this.handleRazorpayFailedPayment(payload);
          // await this.handleRazorpaySubscription(payload);
        }

        if (event === EEventType.tokenCancelled) {
          const payload = req?.body?.payload;
          console.log("inside mandate cancelled", payload);
          await this.handleRazorpayCancelledMandate(payload);
          // await this.handleRazorpaySubscription(payload);
        }
        // await this.handleRazorpaySubscription(req.body.payload);
      } else if (provider === EProvider.cashfree) {
        const eventType = req.body?.type;
        if (eventType === "SUBSCRIPTION_STATUS_CHANGED") {
          await this.handleCashfreeStatusChange(req.body);
        } else if (eventType === "SUBSCRIPTION_PAYMENT_SUCCESS") {
          await this.handleCashfreeNewPayment(req.body);
        } else if (eventType === "SUBSCRIPTION_PAYMENT_FAILED") {
          console.log("provider", "failed");
          await this.handleCashfreeFailedPayment(req.body);
        }
      } else if (provider == EProvider.apple) {
        const decodeId = await this.subscriptionFactory.parseJwt(
          req?.body?.signedPayload
        );
        // console.log("decodeId:", decodeId);
        if (
          decodeId.notificationType === EEventType.didRenew ||
          decodeId.subtype === EEventType.subTypeRenew
        ) {
          await this.handleAppleIAPRenew(decodeId);
        } else if (decodeId.notificationType === EEventType.didCancel) {
          await this.handleAppleIAPCancel(decodeId);
        } else if (
          decodeId.notificationType === EEventType.didPurchase &&
          decodeId.subtype === EEventType.subTypeInitial
        ) {
          await this.handleAppleIAPPurchase(decodeId);
        } else if (
          decodeId.notificationType === EEventType.expired &&
          decodeId.subtype === EEventType.expiredSubType
        ) {
          await this.handleIapExpired(decodeId);
        }
      }
    } catch (err) {
      throw err;
    }
  }
  async handleAppleIAPPurchase(payload) {
    try {
      const transactionHistory =
        await this.subscriptionFactory.getTransactionHistory(payload);
      console.log("transactionHistory", transactionHistory);
      const transactionId = transactionHistory?.transactions?.transactionId;
      // console.log("transactionId", transactionId);
      const existingSubscription = await this.subscriptionModel.findOne({
        externalId: transactionId,
      });

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
          },
        }
      );
      // console.log("updateResult",updateResult);

      if (updateResult.modifiedCount > 0) {
        const updatedInvoice = await this.invoiceService.updateInvoice(
          existingSubscription._id,
          EDocumentStatus.completed
        );

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
      console.error("Error in handleAppleIAPPurchase:", err);
      throw err;
    }
  }

  async handleAppleIAPRenew(payload) {
    try {
      const transactionHistory =
        await this.subscriptionFactory.getTransactionHistory(payload);
      // console.log("transactionHistory", transactionHistory);
      const existingSubscription = await this.subscriptionModel.findOne({
        providerId: EProviderId.apple,
        subscriptionStatus: EStatus.Active,
        "metaData.transaction.originalTransactionId":
          transactionHistory?.transactions?.originalTransactionId,
      });
      console.log("existingSubscription", existingSubscription);
      const metaData = {
        transaction: transactionHistory.transactions,
        renewal: transactionHistory.renewalInfo,
      };
      const subscriptionData = {
        userId: existingSubscription?.userId,
        planId: existingSubscription?.planId,
        subscriptionStatus: EStatus.Active,
        startAt: new Date(transactionHistory.transactions.purchaseDate),
        endAt: new Date(transactionHistory.transactions.expiresDate),
        amount: transactionHistory?.transactions.price,
        status: EStatus.Active,
        notes: { itemId: existingSubscription?.notes?.itemId },
        createBy: existingSubscription?.userId,
        updateBy: existingSubscription?.userId,
        metaData: metaData,
        providerId: EProviderId.apple,
        provider: EProvider.apple,
        externalId: transactionHistory.transactions.transactionId,
      };

      let subscription = await this.subscriptionModel.create(subscriptionData);

      const invoiceData = {
        itemId: existingSubscription?.notes.itemId,
        source_id: subscription._id,
        source_type: "subscription",
        sub_total: transactionHistory?.transactions?.price,
        document_status: EDocumentStatus.completed,
        grand_total: transactionHistory?.transactions?.price,
        currencyCode: transactionHistory?.transactions?.currency,
        user_id: existingSubscription?.userId,
        created_by: existingSubscription?.userId,
        updated_by: existingSubscription?.userId,
      };
      const invoice = await this.invoiceService.createInvoice(invoiceData);
      const conversionRateAmt = await this.helperService.getConversionRate(
        transactionHistory?.transactions?.currency,
        transactionHistory?.transactions?.price
      );
      let amt = parseInt(
        (transactionHistory?.transactions?.price * conversionRateAmt).toString()
      );
      const paymentData = {
        amount: transactionHistory?.transactions?.price,
        document_status: EDocumentStatus.completed,
        providerId: EProviderId.apple,
        providerName: EProvider.apple,
        transactionDate: new Date(),
        currency: existingSubscription.currencyId,
        currencyCode: existingSubscription.currencyCode,
        userId: existingSubscription.userId,
        baseAmount: amt,
        baseCurrency: "INR",
        conversionRate: 1,
      };
      await this.paymentService.createPaymentRecord(paymentData, null, invoice);
      return { message: "Created Successfully" };
    } catch (error) {
      console.error("Error in handleIapRenew:", error);
      throw error;
    }
  }

  async handleAppleIAPCancel(payload) {
    try {
      // console.log("payload", payload);
      const transactionHistory =
        await this.subscriptionFactory.getTransactionHistory(payload);
      // console.log("transactionHistory", transactionHistory);
      const metaData = {
        transaction: transactionHistory.transactions,
        renewal: transactionHistory.renewalInfo,
      };
      await this.subscriptionModel.updateOne(
        {
          "metaData.transaction.originalTransactionId":
            transactionHistory?.transactions?.originalTransactionId,
        },
        {
          subscriptionStatus: EsubscriptionStatus.failed,
          updatedAt: new Date(),
          metaData: metaData,
        }
      );
      let existingSubscription = await this.subscriptionModel.findOne({
        "metaData.transaction.originalTransactionId":
          transactionHistory?.transactions?.originalTransactionId,
      });

      let updatedInvoice = await this.invoiceService.updateInvoice(
        existingSubscription?._id,
        EDocumentStatus.failed
      );
      // console.log("updatedInvoice", updatedInvoice);

      await this.paymentService.updateStatus(
        updatedInvoice?.invoice?._id,
        EDocumentStatus.failed
      );

      let body = {
        status: EDocumentStatus.failed,
        updatedAt: new Date(),
      };
      let mandates = await this.mandateService.updateIapStatusCancel(
        existingSubscription?._id,
        body
      );
      await this.mandateHistoryService.updateIapMandateStatusCancel(
        mandates,
        body
      );
      return { message: "Updated Successfully" };
    } catch (error) {
      console.error("Error in handleIapCancel:", error);
      throw error;
    }
  }
  async handleIapExpired(payload) {
    try {
      const transactionHistory =
        await this.subscriptionFactory.getTransactionHistory(payload);
      console.log("transactionHistory", transactionHistory);
      const metaData = {
        transaction: transactionHistory.transactions,
        renewal: transactionHistory.renewalInfo,
      };
      await this.subscriptionModel.updateOne(
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
      let existingSubscription = await this.subscriptionModel.findOne({
        "metaData.transaction.originalTransactionId":
          transactionHistory?.transactions?.originalTransactionId,
      });

      let updatedInvoice = await this.invoiceService.updateInvoice(
        existingSubscription?._id,
        EDocumentStatus.expired
      );
      // console.log("updatedInvoice", updatedInvoice);
      return { message: "Updated Successfully" };
    } catch (error) {
      console.error("Error in handleIapCancel:", error);
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
      let status = payload?.token?.entity?.recurring_details?.status;
      if (status == "cancellation_initiated") {
        let data = await this.mandateService.updateMandateDetail(
          { "metaData.referenceId": tokenId },
          {
            mandateStatus: EMandateStatus.cancelled,
            "metaData.status": status,
          }
        );
        await this.mandateHistoryService.createMandateHistory({
          mandateId: data?.mandate?._id,
          mandateStatus: EMandateStatus.cancelled,
          "metaData.additionalDetail": payload?.token?.entity,
          status: EStatus.Active,
          createdBy: payload?.token?.entity?.notes?.userId,
          updatedBy: payload?.token?.entity?.notes?.userId,
        });
      }
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
    } catch (err) {
      throw err;
    }
  }
  private async handleRazorpaySubscriptionPayment(payload: any) {
    try {
      console.log("inside razorpay subscription payment");

      const rzpPaymentId = payload?.payment?.entity?.order_id;
      console.log("rzpPaymentId", rzpPaymentId);

      let paymentRequest =
        await this.paymentService.fetchPaymentByOrderId(rzpPaymentId);
      console.log("paymentRequest", paymentRequest);

      if (paymentRequest) {
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
          subscription.subscriptionStatus = "Active";
          await subscription.save();

          let tokenId = payload?.token?.entity?.id;
          let updatedMandate = await this.mandateService.updateMandateDetail(
            { "metaData.subscriptionId": subscription?.subscriptionId },
            {
              mandateStatus: EMandateStatus.active,
              "metaData.referenceId": tokenId,
            }
          );
          await this.mandateHistoryService.createMandateHistory({
            mandateId: updatedMandate?.mandate._id,
            mandateStatus: EMandateStatus.active,
            "metaData.additionalDetail": payload?.token?.entity,
            status: EStatus.Active,
            createdBy: subscription?.userId,
            updatedBy: subscription?.userId,
          });
          let item = await this.itemService.getItemDetail(
            subscription?.notes?.itemId
          );

          let userBody = {
            userId: subscription?.userId,
            membership: item?.itemName,
            badge: item?.additionalDetail?.badge,
          };
          await this.helperService.updateUser(userBody);
          let userData = await this.helperService.getUserById(
            subscription?.userId
          );
          await this.helperService.facebookEvents(
            userData.data.phoneNumber,
            invoice.currencyCode,
            invoice.grand_total
          );
        }
        //await this.paymentService.updateMetaData(paymentRequest?.id, payload);
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
      let invoice = await this.invoiceService.createInvoice({
        source_id: payload.subscription?.entity?.notes?.sourceId,
        source_type: "process",
        sub_total: payload.payment?.entity?.amount,
        document_status: EDocumentStatus.completed,
        grand_total: payload.payment?.entity?.amount,
      });

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
    const cfPaymentId = payload?.data?.cf_payment_id;
    // console.log("inside handleCashfreeNewPayment is ===>", cfPaymentId);

    let paymentRequest =
      await this.paymentService.fetchPaymentByOrderId(cfPaymentId);
    if (paymentRequest) {
      // console.log("invoice id is ==>", paymentRequest.source_id);
      // console.log("paymentId is ==>", paymentRequest._id);

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
        subscription.subscriptionStatus = "Active";
        await subscription.save();

        let item = await this.itemService.getItemDetail(
          subscription?.notes?.itemId
        );

        let userBody = {
          userId: subscription?.userId,
          membership: item?.itemName,
          badge: item?.additionalDetail?.badge,
        };
        await this.helperService.updateUser(userBody);
        let userData = await this.helperService.getUserById(
          subscription?.userId
        );
        await this.helperService.facebookEvents(
          userData.data.phoneNumber,
          invoice.currencyCode,
          invoice.grand_total
        );
      }
      //await this.paymentService.updateMetaData(paymentRequest?.id, payload);
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
          let mixPanelBody: any = {};
          mixPanelBody.eventName = EMixedPanelEvents.subscription_end;
          mixPanelBody.distinctId = expiredSubscriptionsList[i].userId;
          mixPanelBody.properties = {
            start_date: expiredSubscriptionsList[i].currentStart,
            end_date: expiredSubscriptionsList[i].endAt,
            amount: expiredSubscriptionsList[i]?.notes?.amount,
            subscription_id: expiredSubscriptionsList[i]._id,
          };
          await this.helperService.mixPanel(mixPanelBody);
        }

        let userIds = [];

        expiredSubscriptionsList.map((data) => {
          userIds.push(data.userId);
        });
        // console.log(userIds);
        let updateBody = {
          userId: userIds,
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
      // console.log("user id is", token.id);

      let mandates = await this.mandateService.getUserMandates(token.id);
      // console.log("subReferenceIds", subReferenceIds);
      // for (const subRefId of subReferenceIds) {
      const subRefId = mandates[0]?.metaData?.subscription_id;
      // console.log("subRefId", subRefId);
      try {
        const data = await this.helperService.cancelSubscription(subRefId);
        await this.mandateService.updateMandate(mandates[0]._id, {
          cancelDate: new Date().toISOString(),
          cancelReason: body?.reason,
        });
        return {
          subRefId,
          status: "Subscription canceled",
          subscriptionId: data.subscription_id,
          subscriptionStatus: data.subscription_status,
        };
      } catch (error) {
        return { subRefId, status: "FAILED", error: error.message };
      }
      // }
    } catch (error) {
      // console.error("Error in cancelSubscriptionStatus:", error);
      throw error;
    }
  }
  // @Cron("*/10 * * * * *")

  @Cron("0 1 * * *")
  async createCharge() {
    try {
      const planDetail = await this.itemService.getItemDetailByName("PRO");
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      let expiringSubscriptionsList = await this.subscriptionModel.aggregate([
        {
          $sort: {
            _id: -1,
          },
        },
        {
          $match: { _id: new ObjectId("68123487e7836fb7f5b619e0") },
        },
        {
          $group: {
            _id: "$userId",
            latestDocument: { $first: "$$ROOT" },
          },
        },
        {
          $match: { "latestDocument.providerId": 1 },
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
          $group: {
            _id: "$_id",
            latestDocument: { $first: "$latestDocument" },
            latestMandate: { $first: "$mandates" },
          },
        },
        {
          $match: {
            "latestMandate.mandateStatus": {
              $in: [EMandateStatus.active, EMandateStatus.bankPendingApproval],
            },
          },
        },
      ]);

      console.log(
        "expiring list ==>",
        expiringSubscriptionsList.length,
        expiringSubscriptionsList
      );
      for (let i = 0; i < expiringSubscriptionsList.length; i++) {
        let mandate = expiringSubscriptionsList[i]?.latestMandate;
        // if (mandate?.providerId == EProviderId.cashfree) {
        //   await this.createChargeData(expiringSubscriptionsList[i], planDetail);
        // }
        if (mandate?.providerId == EProviderId.razorpay) {
          await this.raiseCharge(expiringSubscriptionsList[i], planDetail);
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async createChargeData(subscriptionData, planDetail) {
    // console.log(
    //   "subscription data is ==>",
    //   subscriptionData?.latestDocument?.metaData?.subscription_id
    // );

    const paymentSequence = await this.sharedService.getNextNumber(
      "cashfree-payment",
      "CSH-PMT",
      5,
      null
    );
    const paymentNewNumber = paymentSequence.toString().padStart(5, "0");
    let paymentNumber = `${paymentNewNumber}-${Date.now()}`;

    let now = new Date();
    let paymentSchedule = new Date(now.getTime() + 26 * 60 * 60 * 1000);

    let authBody = {
      subscription_id:
        subscriptionData?.latestDocument?.metaData?.subscription_id,
      payment_id: paymentNumber,
      payment_amount:
        planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail
          ?.amount,
      payment_type: "CHARGE",
      payment_schedule_date: paymentSchedule.toISOString(),
    };
    // console.log("auth body is ==>", authBody);

    const today = new Date();
    const startAt = new Date();
    startAt.setDate(today.getDate() + 1);
    startAt.setHours(0, 0, 0, 0);
    // console.log("startAt", startAt);

    let endAt = new Date();
    // console.log("endAt", endAt);

    planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail
      ?.validityType == EvalidityType.day
      ? endAt.setDate(
          endAt.getDate() +
            planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail
              ?.validity
        )
      : planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail
            ?.validityType == EvalidityType.month
        ? endAt.setMonth(
            endAt.getMonth() +
              planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail
                ?.validity
          )
        : endAt.setFullYear(
            endAt.getFullYear() +
              planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail
                ?.validity
          );
    let chargeResponse = await this.helperService.createAuth(authBody);

    if (chargeResponse) {
      endAt.setDate(endAt.getDate());
      endAt.setHours(0, 0, 0, 0);
      // console.log("start at ==>", startAt);
      // console.log("end at ==>", endAt);
      // console.log(
      //   "check user id is ==>",
      //   subscriptionData?.latestDocument?.userId
      // );

      let fv = {
        userId: subscriptionData?.latestDocument?.userId,
        planId: subscriptionData?.latestDocument?.planId,
        startAt: startAt,
        amount:
          planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail
            ?.amount,
        providerId: 2,
        endAt: endAt,
        metaData: {
          subscription_id:
            subscriptionData?.latestDocument?.metaData?.subscription_id,
          cf_subscription_id:
            subscriptionData?.latestDocument?.metaData?.cf_subscription_id,
          customer_details:
            subscriptionData?.latestDocument?.metaData?.customer_details,
        },
        notes: {
          itemId: subscriptionData.latestDocument.notes.itemId,
          amount:
            planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail
              ?.amount,
          paymentScheduledAt: paymentSchedule,
          paymentId: paymentNumber,
        },
        subscriptionStatus: EsubscriptionStatus.initiated,
        status: EStatus.Active,
        createdBy: subscriptionData?.latestDocument?.userId,
        updatedBy: subscriptionData?.latestDocument?.userId,
      };
      // console.log("creating subscription", fv);

      let subscription = await this.subscriptionModel.create(fv);

      const invoiceData = {
        itemId: subscriptionData.latestDocument.notes.itemId,
        source_id: subscription._id,
        source_type: "subscription",
        sub_total:
          planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail
            ?.amount,
        currencyCode: "INR",
        document_status: EDocumentStatus.pending,
        grand_total:
          planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail
            ?.amount,
        user_id: subscriptionData.latestDocument.userId,
        created_by: subscriptionData.latestDocument.userId,
        updated_by: subscriptionData.latestDocument.userId,
      };
      // console.log("creating invoice", invoiceData);
      const invoice = await this.invoiceService.createInvoice(invoiceData);

      const paymentData = {
        amount:
          planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail
            ?.amount,
        currencyCode: "INR",
        source_id: invoice._id,
        source_type: EPaymentSourceType.invoice,
        userId: subscriptionData?.latestDocument?.userId,
        document_status: EDocumentStatus.pending,
        paymentType: EPaymentType.charge,
        providerId: 2,
        providerName: EProvider.cashfree,
        transactionDate: paymentSchedule,
      };

      // console.log("creating payment", paymentData);
      await this.paymentService.createPaymentRecord(
        paymentData,
        null,
        invoice,
        "INR",
        { order_id: chargeResponse?.cf_payment_id }
      );
    }
  }

  async raiseCharge(subscriptionData, planDetail) {
    try {
      console.log("inside raise charge");

      // console.log("subscription data is ==>", subscriptionData);

      const paymentSequence = await this.sharedService.getNextNumber(
        "razorpay-payment",
        "RZP-PMT",
        5,
        null
      );
      const paymentNewNumber = paymentSequence.toString().padStart(5, "0");
      let paymentNumber = `${paymentNewNumber}-${Date.now()}`;

      let now = new Date();
      let paymentSchedule = new Date(now.getTime() + 26 * 60 * 60 * 1000);
      let userAdditionalData =
        await this.helperService.getUserAdditionalDetails({
          userId: subscriptionData?.latestDocument?.userId,
        });
      console.log("userAdditionalData is", userAdditionalData);

      let customerId = userAdditionalData?.userAdditional?.referenceId;
      let subscriptionAmount =
        planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail
          ?.amount * 100;
      let paymentScheduleInMM = new Date(paymentSchedule).getTime();
      let paymentScheduleInSeconds = Math.floor(paymentScheduleInMM / 1000);
      let authBody = {
        amount: subscriptionAmount,
        currency: "INR",
        customer_id: customerId,
        payment_capture: true,
        token: {
          max_amount: subscriptionAmount,
          expire_at: paymentScheduleInSeconds,
        },
        notification: {
          token_id: subscriptionData?.latestMandate?.referenceId,
          payment_after: paymentScheduleInSeconds,
        },
        notes: {
          mandateId: subscriptionData?.latestMandate?.referenceId,
          userId: subscriptionData?.latestDocument?.userId,
          subscriptionId: subscriptionData?.latestDocument?.subscriptionId,
        },
      };
      // console.log("auth body is ==>", authBody);

      const today = new Date();
      const startAt = new Date();
      startAt.setDate(today.getDate() + 1);
      startAt.setHours(0, 0, 0, 0);
      // console.log("startAt", startAt);

      let endAt = new Date();
      // console.log("endAt", endAt);

      planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail
        ?.validityType == EvalidityType.day
        ? endAt.setDate(
            endAt.getDate() +
              planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail
                ?.validity
          )
        : planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail
              ?.validityType == EvalidityType.month
          ? endAt.setMonth(
              endAt.getMonth() +
                planDetail?.additionalDetail?.promotionDetails
                  ?.subscriptionDetail?.validity
            )
          : endAt.setFullYear(
              endAt.getFullYear() +
                planDetail?.additionalDetail?.promotionDetails
                  ?.subscriptionDetail?.validity
            );
      // console.log("auth body for razorpay is ==>", authBody);

      let chargeResponse = await this.helperService.addSubscription(authBody);
      // console.log("charge response is", chargeResponse);

      let recurring = {
        email: userAdditionalData?.userAdditional?.userId?.emailId,
        contact: userAdditionalData?.userAdditional?.userId?.phoneNumber,
        amount: subscriptionAmount,
        currency: "INR",
        order_id: chargeResponse?.id,
        customer_id: customerId,
        token: subscriptionData?.latestMandate?.referenceId,
        recurring: "1",
        notes: {
          userId: subscriptionData?.latestDocument?.userId,
          userReferenceId: customerId,
          razorpayOrderId: chargeResponse?.id,
        },
      };
      // console.log("recurring body is", recurring);

      let recurringResponse =
        await this.helperService.createRecurringPayment(recurring);
      // console.log("recurring response is", recurringResponse);
      // return true;
      if (recurringResponse) {
        endAt.setDate(endAt.getDate());
        endAt.setHours(23, 59, 59, 999);

        let fv = {
          userId: subscriptionData?.latestDocument?.userId,
          startAt: startAt,
          amount:
            planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail
              ?.amount,
          providerId: 1,
          provider: EProvider.razorpay,
          endAt: endAt,
          metaData: {
            subscription_id:
              subscriptionData?.latestDocument?.metaData?.subscriptionId,
            ...chargeResponse,
          },
          notes: {
            itemId: subscriptionData?.latestDocument?.notes?.itemId,
            amount: subscriptionAmount,
            paymentScheduledAt: paymentSchedule,
            paymentId: paymentNumber,
          },
          subscriptionStatus: EsubscriptionStatus.initiated,
          status: EStatus.Active,
          createdBy: subscriptionData?.latestDocument?.userId,
          updatedBy: subscriptionData?.latestDocument?.userId,
        };
        // console.log("creating subscription", fv);

        let subscription = await this.subscriptionModel.create(fv);

        const invoiceData = {
          itemId: subscriptionData.latestDocument.notes.itemId,
          source_id: subscription._id,
          source_type: "subscription",
          sub_total:
            planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail
              ?.amount,
          currencyCode: "INR",
          document_status: EDocumentStatus.pending,
          grand_total:
            planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail
              ?.amount,
          user_id: subscriptionData?.latestDocument?.userId,
          created_by: subscriptionData?.latestDocument?.userId,
          updated_by: subscriptionData?.latestDocument?.userId,
        };
        // console.log("creating invoice", invoiceData);
        const invoice = await this.invoiceService.createInvoice(invoiceData);

        const paymentData = {
          amount:
            planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail
              ?.amount,
          currencyCode: "INR",
          source_id: invoice._id,
          source_type: EPaymentSourceType.invoice,
          userId: subscriptionData?.latestDocument?.userId,
          document_status: EDocumentStatus.pending,
          paymentType: EPaymentType.charge,
          providerId: 1,
          providerName: EProvider.razorpay,
          transactionDate: paymentSchedule,
        };

        // console.log("creating payment", paymentData);
        await this.paymentService.createPaymentRecord(
          paymentData,
          null,
          invoice,
          "INR",
          { order_id: chargeResponse?.id }
        );
      }
    } catch (err) {
      throw err;
    }
  }

  async updatePaymentRecords(paymentId: string, body: UpdatePaymentBody) {
    try {
      console.log("update payment records ==>", body);

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
  async findExternalId(transactionId) {
    try {
      let externalIdData = await this.subscriptionModel.findOne({
        "metaData.externalId": transactionId,
        providerId: { $in: [EProviderId.apple, EProviderId.google] },
        // provider: EProvider.apple,
      });
      return externalIdData;
    } catch (error) {
      throw error;
    }
  }
}
