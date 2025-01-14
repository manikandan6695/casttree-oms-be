import { Injectable, Req } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ISubscriptionModel } from "./schema/subscription.schema";
import { Model } from "mongoose";
import { CtApiService } from "src/ct-api/ct-api.service";
import { CreateSubscriptionDTO } from "./dto/subscription.dto";
import { UserToken } from "src/user/dto/usertoken.dto";

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel("subscription")
    private readonly subscriptionModel: Model<ISubscriptionModel>,
    private ctApiService: CtApiService
  ) {}

  async createSubscription(body: CreateSubscriptionDTO, token: UserToken) {
    try {
      let fv = {
        plan_id: body.planId,
        total_count: 1,
        notes: {
          userId: token.id,
          sourceId: body.sourceId,
          sourceType: body.sourceType,
        },
      };
      let data = await this.ctApiService.addSubscription(fv, token);

      return { data };
    } catch (err) {
      throw err;
    }
  }

  async subscriptionWebhook(@Req() req) {
    try {
      await this.extractSubscriptionDetails(req.body);
    } catch (err) {
      throw err;
    }
  }

  async extractSubscriptionDetails(body) {
    try {
      console.log(
        "extrat payment invoice id",
        body?.payload?.payment?.entity?.notes.invoiceId,
        body?.payload?.payment?.entity?.notes
      );
    } catch (err) {
      throw err;
    }
  }
}
