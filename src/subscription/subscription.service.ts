import { Injectable, Req } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ISubscriptionModel } from "./schema/subscription.schema";
import { Model } from "mongoose";
import { CreateSubscriptionDTO } from "./dto/subscription.dto";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { HelperService } from "src/helper/helper.service";
import { EStatus } from "src/shared/enum/privacy.enum";
import { InvoiceService } from "src/invoice/invoice.service";
import { EDocumentStatus } from "src/invoice/enum/document-status.enum";
import { PaymentRequestService } from "src/payment/payment-request.service";
import { SharedService } from "src/shared/shared.service";
import { EVENT_UPDATE_USER } from "src/shared/app.constants";
import { ItemService } from "src/item/item.service";

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
        total_count: 1,
        quantity: 1,
        notes: {
          userId: token.id,
          sourceId: body.sourceId,
          sourceType: body.sourceType,
          itemId: body.itemId,
        },
      };
      console.log("create subscription fv ===>", fv);

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
        console.log("inside subscription creation ===>");

        let fv = {
          userId: req.body?.payload?.subscription?.entity?.notes?.userId,
          planId: req.body?.payload?.subscription?.entity?.plan_id,
          totalCount: req.body?.payload?.subscription?.total_count,
          currentStart: req.body?.payload?.subscription?.entity?.current_start,
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
        console.log("subscription created ===>", subscription);

        let invoice = await this.invoiceService.createInvoice({
          source_id: req.body?.payload?.subscription?.entity?.notes?.sourceId,
          source_type: "process",
          sub_total: req.body?.payload?.payment?.entity?.amount,
          document_status: EDocumentStatus.completed,
          grand_total: req.body?.payload?.payment?.entity?.amount,
        });
        console.log("invoice id is ==>", invoice._id);

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
        console.log("payment ===>", payment._id);
        console.log(
          "subscription entity notes",
          req.body?.payload?.subscription?.entity?.notes
        );

        let item = await this.itemService.getItemDetail(
          req.body?.payload?.subscription?.entity?.notes?.itemId
        );

        console.log("item data is===>", item._id,item?.itemName);

        let userBody = {
          userId: req.body?.payload?.subscription?.entity?.notes?.userId,
          membership: item?.itemName,
          badge: item?.additionalDetail?.badge,
        };
        console.log("user body to emit event ==>", userBody);

        await this.sharedService.trackAndEmitEvent(
          EVENT_UPDATE_USER,
          userBody,
          true,
          {
            userId:
              req.body?.payload?.subscription?.entity?.notes?.userId.toString(),
            resourceUri: null,
            action: null,
          }
        );
      }
    } catch (err) {
      throw err;
    }
  }

  async validateSubscription(userId: string) {
    try {
      let subscription = await this.subscriptionModel.findOne({
        userId: userId,
      });
      return subscription;
    } catch (err) {
      throw err;
    }
  }
}
