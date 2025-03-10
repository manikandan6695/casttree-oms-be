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

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel("subscription")
    private readonly subscriptionModel: Model<ISubscriptionModel>,
    private invoiceService: InvoiceService,
    private paymentService: PaymentRequestService,
    private helperService: HelperService,
    private sharedService: SharedService,
    private itemService: ItemService
  ) {}

  async createSubscription(body: CreateSubscriptionDTO, token: UserToken) {
    try {
      let fv = {
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

      let data = await this.helperService.addSubscription(fv, token);

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

  @Cron('0 */5 * * * *')
  async handleCron() {
    try {
      const now = new Date();
      let currentDate = now.toISOString();
      console.log("updating subscription entries : " + currentDate);
      let expiredSubscriptionsList = await this.subscriptionModel.find({ subscriptionStatus: EsubscriptionStatus.active, currentEnd: { $lte: currentDate }, status: Estatus.Active });
      if (expiredSubscriptionsList.length > 0) {
        await this.subscriptionModel.updateMany({ subscriptionStatus: EsubscriptionStatus.active, currentEnd: { $lte: currentDate }, status: Estatus.Active }, { $set: { subscriptionStatus: EsubscriptionStatus.expired } });
        let userIds = [];

        expiredSubscriptionsList.map((data) => { userIds.push(data.userId) });
        console.log(userIds);
        let updateBody = {
          userId: userIds,
          membership: "",
          badge: ""
        };
        console.log(updateBody);
        await this.helperService.updateUsers(updateBody);
      }
    } catch (err) {
      throw err;
    }
  }
}
