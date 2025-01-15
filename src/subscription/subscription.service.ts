import { Injectable, Req } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ISubscriptionModel } from "./schema/subscription.schema";
import { Model } from "mongoose";
import { CreateSubscriptionDTO } from "./dto/subscription.dto";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { HelperService } from "src/helper/helper.service";

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel("subscription")
    private readonly subscriptionModel: Model<ISubscriptionModel>,
    private helperService: HelperService
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
      let data = await this.helperService.addSubscription(fv, token);

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
      console.log("webhook", body?.payload,body);
    } catch (err) {
      throw err;
    }
  }
}
