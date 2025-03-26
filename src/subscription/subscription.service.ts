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
import { MandateHistoryService } from "src/mandates/mandate-history/mandate-history.service";
import { MandatesService } from "src/mandates/mandates.service";
import { PaymentRequestService } from "src/payment/payment-request.service";
import { EStatus } from "src/shared/enum/privacy.enum";
import { SharedService } from "src/shared/shared.service";
import { CreateSubscriptionDTO } from "./dto/subscription.dto";
import { EsubscriptionStatus } from "./enums/subscriptionStatus.enum";
import { EvalidityType } from "./enums/validityType.enum";
import { ISubscriptionModel } from "./schema/subscription.schema";
import { SubscriptionFactory } from "./subscription.factory";

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
  ) { }

  async createSubscription(body: CreateSubscriptionDTO, token: any) {
    try {
      let subscriptionData;

      switch (body.provider) {
        case "razorpay":
          subscriptionData = {
            plan_id: body.planId,
            total_count: 10,
            quantity: 1,
            notes: {
              userId: token.id,
              sourceId: body.sourceId,
              sourceType: body.sourceType,
              itemId: body.itemId,
            },
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

          body["expiryTime"] = expiryTime;
          body["firstCharge"] = firstCharge;
          subscriptionData = {
            subscription_id: subscriptionNumber,
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
      // console.log("provider id is ===>", providerId);

      // await this.extractSubscriptionDetails(req.body);
      // if (req.body?.payload?.subscription) {
      //   let existingSubscription = await this.subscriptionModel.findOne({
      //     userId: req.body?.payload?.subscription?.entity?.notes?.userId,
      //   });
      //   if (!existingSubscription) {
      //     let fv = {
      //       userId: req.body?.payload?.subscription?.entity?.notes?.userId,
      //       planId: req.body?.payload?.subscription?.entity?.plan_id,
      //       totalCount: req.body?.payload?.subscription?.total_count,
      //       currentStart:
      //         req.body?.payload?.subscription?.entity?.current_start,
      //       quantity: req.body?.payload?.subscription?.entity?.quantity,
      //       currentEnd: req.body?.payload?.subscription?.entity?.current_end,
      //       scheduleChangeAt:
      //         req.body?.payload?.subscription?.entity?.change_scheduled_at,
      //       endAt: req.body?.payload?.subscription?.entity?.end_at,
      //       paidCount: req.body?.payload?.subscription?.entity?.paid_count,
      //       expireBy: req.body?.payload?.subscription?.entity?.expire_by,
      //       notes: req.body?.payload?.subscription?.entity?.notes,
      //       subscriptionStatus: req.body?.payload?.subscription?.entity?.status,
      //       metaData: req.body?.payload,
      //       status: EStatus.Active,
      //       createdBy: req.body?.payload?.subscription?.entity?.notes?.userId,
      //       updatedBy: req.body?.payload?.subscription?.entity?.notes?.userId,
      //     };
      //     let subscription = await this.subscriptionModel.create(fv);
      //     let invoice = await this.invoiceService.createInvoice({
      //       source_id: req.body?.payload?.subscription?.entity?.notes?.sourceId,
      //       source_type: "process",
      //       sub_total: req.body?.payload?.payment?.entity?.amount,
      //       document_status: EDocumentStatus.completed,
      //       grand_total: req.body?.payload?.payment?.entity?.amount,
      //     });
      //     let invoiceFV: any = {
      //       amount: req.body?.payload?.payment?.entity?.amount,
      //       invoiceDetail: {
      //         sourceId: invoice._id,
      //       },
      //       document_status: EDocumentStatus.completed,
      //     };
      //     let payment = await this.paymentService.createPaymentRecord(
      //       invoiceFV,
      //       null,
      //       invoice,
      //       null,
      //       null
      //     );
      //     let item = await this.itemService.getItemDetail(
      //       req.body?.payload?.subscription?.entity?.notes?.itemId
      //     );
      //     let userBody = {
      //       userId: req.body?.payload?.subscription?.entity?.notes?.userId,
      //       membership: item?.itemName,
      //       badge: item?.additionalDetail?.badge,
      //     };
      //     await this.helperService.updateUser(userBody);
      //   }
      //   // await this.sharedService.trackAndEmitEvent(
      //   //   EVENT_UPDATE_USER,
      //   //   userBody,
      //   //   true,
      //   //   {
      //   //     userId:
      //   //       req.body?.payload?.subscription?.entity?.notes?.userId.toString(),
      //   //     resourceUri: null,
      //   //     action: null,
      //   //   }
      //   // );
      // }
      const provider = providerId == 2 ? "cashfree" : "razorpay";

      console.log("provider", provider);
      if (provider === "razorpay" && req.body?.payload?.subscription) {
        await this.handleRazorpaySubscription(req.body.payload);

      } else if (provider === "cashfree") {
        const eventType = req.body?.type; // Identify Cashfree event type
        // console.log("event type is", eventType);

        if (eventType === "SUBSCRIPTION_STATUS_CHANGED") {
          await this.handleCashfreeStatusChange(req.body);
        } else if (eventType === "SUBSCRIPTION_PAYMENT_SUCCESS") {
          await this.handleCashfreeNewPayment(req.body);
        }
        else if (eventType === "SUBSCRIPTION_PAYMENT_FAILED") {
          console.log("provider", "failed");
          await this.reschedulePayment(req.body);
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
      let fv = {
        userId: payload.subscription?.entity?.notes?.userId,
        planId: payload.subscription?.entity?.plan_id,
        totalCount: payload.subscription?.total_count,
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

      let invoiceFV: any = {
        amount: payload.payment?.entity?.amount,
        invoiceDetail: { sourceId: invoice._id },
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

      let userBody = {
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
    // console.log("cfSubId", cfSubId);

    let statusChange = (str) => str.charAt(0) + str.slice(1).toLowerCase();
    const newStatus = statusChange(
      payload?.data?.subscription_details?.subscription_status
    );
    // console.log("newStatus", newStatus);
    let mandate = await this.mandateService.getMandate(cfSubId);
    if (mandate) {
      mandate.mandateStatus = newStatus;
      await mandate.save();

      await this.mandateHistoryService.createMandateHistory({
        mandateId: mandate._id,
        mandateStatus: newStatus,
      });
    }
  }

  // Handles Cashfree new payment event
  private async handleCashfreeNewPayment(payload: any) {

    const cfPaymentId = payload?.data?.cf_payment_id;
    // console.log("inside handleCashfreeNewPayment is ===>", payload);
    // console.log("cfPaymentId", cfPaymentId);

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
      }
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

  async reschedulePayment(payload) {
    try {
      console.log("called");
      const now = new Date();
      let currentDate = new Date(now);
      let paymentId = payload?.data?.payment_id;
      let subscriptionId = payload?.data?.cf_subscription_id;
      let body = {
        subscriptionStatus: "Expired",
        paymentStatus: "Failed"
      }
      console.log("updating subs");
      await this.subscriptionModel.updateOne({ "metaData.subscription_id": subscriptionId, "notes.paymentId": paymentId, subscriptionStatus: EsubscriptionStatus.initiated }, { $set: { subscriptionStatus: EsubscriptionStatus.expired, status: Estatus.Inactive } })
      console.log("updating sales");
      await this.updatePaymentRecords(paymentId, body);
      let subscriptionData = await this.subscriptionModel.find({ "metaData.subscription_id": subscriptionId, subscriptionStatus: EsubscriptionStatus.active }).sort({ _id: -1 }).lean();
      console.log(subscriptionData[0]);
      let subscription: any = subscriptionData[0];
      subscription.endAt = currentDate;
      subscription["latestSubscription"] = subscription;
      const planDetail = await this.itemService.getItemDetailByName("PRO");
      console.log("creatingh new");
      await this.createChargeData(subscription, planDetail,true);
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
        startAt: body.startAt,
        endAt: body.endAt,
        notes: body.notes,
        subscriptionStatus: body.subscriptionStatus,
        metaData: body.metaData,
        status: EStatus.Active,
        createdBy: token.id,
        updatedBy: token.id,
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

      let subscriptionData = await this.validateSubscription(token.id, [EsubscriptionStatus.initiated]);
      let itemDetails = await this.itemService.getItemDetail(body.itemId);
      let subscriptionDetailsData = subscriptionData ?
        itemDetails?.additionalDetail?.promotionDetails?.subscriptionDetail : itemDetails?.additionalDetail?.promotionDetails?.authDetail;
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
        currentEnd: { $lte: currentDate },
        status: Estatus.Active,
      });
      if (expiredSubscriptionsList.length > 0) {
        await this.subscriptionModel.updateMany(
          {
            subscriptionStatus: EsubscriptionStatus.active,
            currentEnd: { $lte: currentDate },
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
            end_date: expiredSubscriptionsList[i].currentEnd,
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
  async cancelSubscriptionStatus(token: UserToken, body: any) {
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


  @Cron("0/20 * * * * *")
  async createCharge() {
    try {

      const planDetail = await this.itemService.getItemDetailByName("PRO");
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 2);
      let expiringSubscriptionsList = await this.subscriptionModel.aggregate([
        {
          $group: {
            _id: '$userId',
            subscriptions: { $push: '$$ROOT' },
            hasInitiated: {
              $sum: {
                $cond: [{ $eq: ['$subscriptionStatus', 'Initiated'] }, 1, 0],
              },
            },
          },
        },
        {
          $match: {
            hasInitiated: 0,
          },
        },
        {
          $unwind: '$subscriptions',
        },
        {
          $match: {
            'subscriptions.endAt': { $lt: tomorrow },
            'subscriptions.subscriptionStatus': Estatus.Active,
            'subscriptions.status': Estatus.Active,
          },
        },
        {
          $sort: {
            'subscriptions.createdAt': -1,
          },
        },
        {
          $group: {
            _id: '$_id',
            latestSubscription: { $first: '$subscriptions' },
          },
        },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            latestSubscription: 1,
          },
        },
      ]);
      
      
      console.log(".............", expiringSubscriptionsList.length, expiringSubscriptionsList);
     for (let i = 0; i < expiringSubscriptionsList.length; i++) {
        await this.createChargeData(expiringSubscriptionsList[i], planDetail);
      }

    } catch (error) {
      throw error;
    }
  }


  async createChargeData(subscriptionData, planDetail,retry?: boolean) {
    const paymentSequence = await this.sharedService.getNextNumber(
      "cashfree-payment",
      "CSH-PMT",
      5,
      null
    );
    const paymentNumber = paymentSequence.toString().padStart(5, "0");
    let paymentSchedule = subscriptionData.latestSubscription.endAt;
    paymentSchedule = new Date(paymentSchedule);
    paymentSchedule.setDate(paymentSchedule.getDate());
    retry ? paymentSchedule.setDate(paymentSchedule.getDate() + 2) : paymentSchedule;
    paymentSchedule.setHours(0, 0, 0, 0);
    let authBody = {
      "subscription_id": subscriptionData.latestSubscription.metaData.subscription_id,
      "payment_id": paymentNumber,
      "payment_amount": planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail?.amount,
      "payment_type": "CHARGE",
      "payment_schedule_date":paymentSchedule 
    }
    let endAt = new Date(subscriptionData.latestSubscription.endAt);
    planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail?.validityType == EvalidityType.day
      ? endAt.setDate(endAt.getDate() + planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail?.validity)
      : planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail?.validityType == EvalidityType.month
        ? endAt.setMonth(
          endAt.getMonth() + planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail?.validity
        )
        : endAt.setFullYear(
          endAt.getFullYear() + planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail?.validity
        );
    let chargeReponse = await this.helperService.createAuth(authBody);
    if (chargeReponse.payment_status == "INITIALIZED") {

      console.log(paymentSchedule, subscriptionData.latestSubscription.endAt, endAt)

    }
    let fv = {
      userId: subscriptionData.latestSubscription.userId,
      planId: subscriptionData.latestSubscription.planId,
      startAt: subscriptionData.latestSubscription.endAt,
      endAt: endAt,
      metaData: {
        subscription_id: subscriptionData.latestSubscription.metaData.subscription_id
      },
      notes: {
        itemId: subscriptionData.latestSubscription.notes.itemId,
        userId: subscriptionData.latestSubscription.userId,
        amount: planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail?.amount,
        paymentScheduledAt: paymentSchedule,
        paymentId: paymentNumber
      },
      subscriptionStatus: EsubscriptionStatus.initiated,
      status: EStatus.Active,
      createdBy: subscriptionData.latestSubscription.userId,
      updatedBy: subscriptionData.latestSubscription.userId,
    };
    let subscription = await this.subscriptionModel.create(fv);
    const invoiceData = {
      itemId: subscriptionData.latestSubscription.notes.itemId,
      source_id: subscription._id,
      source_type: "subscription",
      sub_total: planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail?.amount,
      currencyCode: "INR",
      document_status: EDocumentStatus.pending,
      grand_total: planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail?.amount,
      user_id: subscriptionData.latestSubscription.userId,
      created_by: subscriptionData.latestSubscription.userId,
      updated_by: subscriptionData.latestSubscription.userId,
    };
    console.log("creating invoice");
    const invoice = await this.invoiceService.createInvoice(invoiceData);

    const paymentData = {
      amount: planDetail?.additionalDetail?.promotionDetails?.subscriptionDetail?.amount,
      currencyCode: "INR",
      document_status: EDocumentStatus.pending,
    };

    console.log("creating payment");
    await this.paymentService.createPaymentRecord(
      paymentData,
      null,
      invoice,
      "INR",
      { order_id: paymentNumber }
    );

  }

  async updatePaymentRecords(
    paymentId: string, body: any
  ) {
    try {
      let payment = await this.paymentService.fetchPaymentByOrderId(paymentId);
      await this.invoiceService.updateInvoice(payment.source_id, body.paymentStatus);
      await this.paymentService.updateStatus(paymentId, body.paymentStatus);
      return { message: "Success" }

    } catch (err) { throw err }
  }

}
