import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { Mandate, MandateDocument } from "./schema/mandates.schema";

@Injectable()
export class MandatesService {
  constructor(
    @InjectModel(Mandate.name)
    private readonly mandateModel: Model<MandateDocument>
  ) {}

  async addMandate(body: any, token: UserToken): Promise<MandateDocument> {
    try {
      // console.log("mandate body is", body);

      const mandatePayload = {
        sourceId: body.sourceId,
        userId: body.userId,
        paymentMethod: body.paymentMethod,
        amount: body.amount,
        providerId: body.providerId,
        planId: body.planId,
        currency: body.currency,
        frequency: body.frequency,
        mandateStatus: body.mandateStatus,
        status: body.status,
        metaData: body.metaData,
        startDate: body.startDate,
        endDate: body.endDate,
        createdBy: token.id,
        updatedBy: token.id,
      };
      const mandates = await this.mandateModel.create(mandatePayload);
      return mandates;
    } catch (error) {
      throw new Error(error);
    }
  }

  async getMandate(subscriptionId) {
    try {
      let data = await this.mandateModel.findOne({
        "metaData.subscription_id": subscriptionId,
      });
      return data;
    } catch (err) {
      throw err;
    }
  }
  async fetchMandates(token: UserToken) {
    try {
      let filter = { userId: token.id, status: "Active" };
      let mandatesData = await this.mandateModel.find(filter).sort({ _id: -1 });
      return mandatesData;
    } catch (error) {
      throw error;
    }
  }
  async getUserMandates(userId: string) {
    try {
      let filter = { userId, status: "Active" };

      let mandates = await this.mandateModel.find(filter).sort({ _id: -1 });

      return mandates;
    } catch (error) {
      throw error;
    }
  }

  async updateMandate(_id: any, body: any) {
    try {
      let mandate = await this.mandateModel.updateOne({ _id: _id }, body);

      return { message: "Updated Successfully" };
    } catch (error) {
      throw error;
    }
  }
}
