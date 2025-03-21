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

      console.log("body", body);

      const mandatePayload = {
        sourceId: body.sourceId,
        userId: body.userId,
        paymentMethod: body.paymentMethod,
        amount: body.amount,
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

    async fetchMandates(token: UserToken) {
      try {
        let filter = { userId: token.id, status: "Active" }
        let mandatesData = await this.mandateModel.find(filter)
        return mandatesData
      } catch (error) {
        throw error;
      }
    }
    async getUserMandates(userId: string): Promise<string[]> {
      try {
        let filter = { userId };
        
        let mandates = await this.mandateModel.find(filter, { "metaData.subscription_id": 1 });
    
        return mandates
          .map(mandate => mandate.metaData?.subscription_id)
          .filter(id => id); 
      }
      catch (error) {
       throw error  
      }
  }
}
