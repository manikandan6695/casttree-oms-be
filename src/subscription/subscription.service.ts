import { Injectable, Req } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import { Model } from "mongoose";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { HelperService } from "src/helper/helper.service";
import { EDocumentStatus } from "src/invoice/enum/document-status.enum";
import { InvoiceService } from "src/invoice/invoice.service";
import { Estatus } from "src/item/enum/status.enum";
import { ItemService } from "src/item/item.service";
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
    private itemService: ItemService
  ) {}

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
          subscriptionData = {
            subscription_id: subscriptionNumber,
            customer_details: {
              customer_name: token.userName,
              customer_email: token.phoneNumber + "@casttree.com",
              customer_phone: token.phoneNumber,
            },
            plan_details: {
              plan_name: planData.plan_name,
              plan_id: planData.plan_id,
              plan_type: planData.plan_type,
              plan_amount: planData.plan_recurring_amount,
              plan_max_amount: planData.plan_max_amount,
              plan_max_cycles: planData.plan_max_cycles,
              plan_intervals: planData.plan_intervals,
              plan_interval_type: planData.plan_interval_type,
              plan_currency: planData.plan_currency,
            },
            authorization_details: {
              authorization_amount: body.authAmount == 0 ? 1 : body.authAmount,
              authorization_amount_refund: body.authAmount == 0 ? true : false,
              payment_methods: ["upi"],
            },
            subscription_meta: {
              return_url: body.redirectionUrl,
            },
            subscription_expiry_time: this.sharedService.getFutureYearISO(5),
            subscription_first_charge_time:
              body.validityType == "day"
                ? this.sharedService.getFutureDateISO(body.validity)
                : this.sharedService.getFutureMonthISO(body.validity),
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

  async subscriptionWebhook(@Req() req) {
    try {
      // await this.extractSubscriptionDetails(req.body);
      if (req.body?.payload?.subscription) {
        let existingSubscription = await this.subscriptionModel.findOne({
          userId: req.body?.payload?.subscription?.entity?.notes?.userId,
        });
        if (!existingSubscription) {
          let fv = {
            userId: req.body?.payload?.subscription?.entity?.notes?.userId,
            planId: req.body?.payload?.subscription?.entity?.plan_id,
            totalCount: req.body?.payload?.subscription?.total_count,
            currentStart:
              req.body?.payload?.subscription?.entity?.current_start,
            quantity: req.body?.payload?.subscription?.entity?.quantity,
            currentEnd: req.body?.payload?.subscription?.entity?.current_end,
            scheduleChangeAt:
              req.body?.payload?.subscription?.entity?.change_scheduled_at,
            endAt: req.body?.payload?.subscription?.entity?.end_at,
            paidCount: req.body?.payload?.subscription?.entity?.paid_count,
            expireBy: req.body?.payload?.subscription?.entity?.expire_by,
            notes: req.body?.payload?.subscription?.entity?.notes,
            subscriptionStatus: req.body?.payload?.subscription?.entity?.status,
            metaData: req.body?.payload,
            status: EStatus.Active,
            createdBy: req.body?.payload?.subscription?.entity?.notes?.userId,
            updatedBy: req.body?.payload?.subscription?.entity?.notes?.userId,
          };

          let subscription = await this.subscriptionModel.create(fv);

          let invoice = await this.invoiceService.createInvoice({
            source_id: req.body?.payload?.subscription?.entity?.notes?.sourceId,
            source_type: "process",
            sub_total: req.body?.payload?.payment?.entity?.amount,
            document_status: EDocumentStatus.completed,
            grand_total: req.body?.payload?.payment?.entity?.amount,
          });

          let invoiceFV: any = {
            amount: req.body?.payload?.payment?.entity?.amount,
            invoiceDetail: {
              sourceId: invoice._id,
            },
            document_status: EDocumentStatus.completed,
          };
          let payment = await this.paymentService.createPaymentRecord(
            invoiceFV,
            null,
            invoice,
            null,
            null
          );

          let item = await this.itemService.getItemDetail(
            req.body?.payload?.subscription?.entity?.notes?.itemId
          );

          let userBody = {
            userId: req.body?.payload?.subscription?.entity?.notes?.userId,
            membership: item?.itemName,
            badge: item?.additionalDetail?.badge,
          };

          await this.helperService.updateUser(userBody);
        }

        // await this.sharedService.trackAndEmitEvent(
        //   EVENT_UPDATE_USER,
        //   userBody,
        //   true,
        //   {
        //     userId:
        //       req.body?.payload?.subscription?.entity?.notes?.userId.toString(),
        //     resourceUri: null,
        //     action: null,
        //   }
        // );
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
      let itemDetails = await this.itemService.getItemDetail(body.itemId);
      const now = new Date();
      let currentDate = now.toISOString();
      var duedate = new Date(now);
      if (body.validity) {
        body.validityType == EvalidityType.day
          ? duedate.setDate(now.getDate() + body.validity)
          : body.validityType == EvalidityType.month
            ? duedate.setMonth(duedate.getMonth() + body.validity)
            : duedate.setFullYear(duedate.getFullYear() + body.validity);
      } else {
        duedate.setFullYear(duedate.getFullYear() + 1);
      }

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

      let item = await this.itemService.getItemDetail(body.itemId);

      let userBody = {
        userId: token.id,
        membership: item?.itemName,
        badge: item?.additionalDetail?.badge,
      };

      await this.helperService.updateUser(userBody);

      return subscription;
    } catch (err) {
      throw err;
    }
  }

  @Cron("*/10 * * * *")
  async handleCron() {
    try {
      const now = new Date();
      let currentDate = now.toISOString();
      console.log("updating subscription entries : " + currentDate);
      let updateSubscriptionData = await this.subscriptionModel.updateMany(
        {
          subscriptionStatus: EsubscriptionStatus.active,
          currentEnd: { $lte: currentDate },
          status: Estatus.Active,
        },
        { $set: { subscriptionStatus: EsubscriptionStatus.expired } }
      );
    } catch (err) {
      throw err;
    }
  }
}
