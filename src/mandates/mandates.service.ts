import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { EMandateStatus } from "./enum/mandate.enum";
import { Mandate, MandateDocument } from "./schema/mandates.schema";
const { ObjectId } = require("mongodb");
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

  async getMandate(id) {
    try {
      let data = await this.mandateModel.findOne({
        "metaData.subscription_id": id,
      });
      return data;
    } catch (err) {
      throw err;
    }
  }

  async getMandateById(id) {
    try {
      let data = await this.mandateModel.findOne({ referenceId: id });
      return data;
    } catch (err) {
      throw err;
    }
  }
  async fetchMandates(token: UserToken) {
    try {
      let filter = { userId: token.id, status: "Active" ,mandateStatus :EMandateStatus.active};
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
      // console.log("mandate cancel",_id , body);
      
      let mandate = await this.mandateModel.updateOne({ _id: _id }, body);

      return { message: "Updated Successfully" };
    } catch (error) {
      throw error;
    }
  }

  async updateMandateDetail(filter: any, criteria: any) {
    try {
      // console.log("inside mandate update service", filter, criteria);

      await this.mandateModel.updateOne(filter, criteria);
      let mandate = await this.mandateModel.findOne(filter);

      return { message: "Updated Successfully", mandate };
    } catch (error) {
      throw error;
    }
  }
  async createMandate(body: any): Promise<MandateDocument> {
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
        createdBy: body.UserId,
        updatedBy: body.UserId,
      };
      const mandates = await this.mandateModel.create(mandatePayload);
      return mandates;
    } catch (error) {
      throw new Error(error);
    }
  }
  async updateIapStatus(id, data) {
    try {
      // console.log("data",data,id);

      let updateStatus = await this.mandateModel.findOneAndUpdate(
        { "metaData.externalId": id },
        { $set: { mandateStatus: data.status, updatedAt: data.updatedAt } }
      );
      return updateStatus;
    } catch (err) {
      throw err;
    }
  }
  async updateIapStatusCancel(id, data) {
    try {
      const updatedDoc = await this.mandateModel
        .findOneAndUpdate(
          { sourceId: id },
          { $set: { mandateStatus: data.status, updatedAt: data.updatedAt } },
          { new: true }
        )
        .select("_id");

      return updatedDoc;
    } catch (err) {
      throw err;
    }
  }

  async getMandateByProvider(userId: string) {
    try {
      let aggregationPipeLine = [];
      aggregationPipeLine.push(
        {
          $sort: {
            _id: -1,
          },
        },
        {
          $match: {
            mandateStatus: {
              $in: [EMandateStatus.active, EMandateStatus.expired],
            },
            userId: new ObjectId(userId),
          },
        },
        {
          $project: {
            providerId: 1,
            amount: 1,
            mandateStatus: 1,
          },
        },
        {
          $group: {
            _id: "$providerId",
            mandates: {
              $push: {
                providerId: "$providerId",
                amount: "$amount",
                mandateStatus: "$mandateStatus",
              },
            },
          },
        }
      );
      let data = await this.mandateModel.aggregate(aggregationPipeLine);
      let mandate = data[0];
      return { mandate };
    } catch (err) {
      throw err;
    }
  }
  async getMandatesByExternalId(externalId: string, status:string) {
    try {
      let mandates = await this.mandateModel.find({
        "metaData.externalId": externalId,
        mandateStatus: status
      });
      return mandates;
    } catch (err) {
      throw err;
    }
  }
  async getMandateBySourceId(token, status) {
    try {
      let mandates = await this.mandateModel.findOne({
        "metaData.externalId": token,
        mandateStatus: status
      });
      return mandates;
    } catch (err) {
      throw err;
    }
  }
}
