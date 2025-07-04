import { Injectable } from "@nestjs/common";
import {
  MandateHistory,
  MandateHistoryDocument,
} from "../schema/mandates-history.schema";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";

@Injectable()
export class MandateHistoryService {
  constructor(
    @InjectModel(MandateHistory.name)
    private readonly mandateHistoryModel: Model<MandateHistoryDocument>
  ) {}

  async createMandateHistory(body) {
    try {
      let mandateHistory = await this.mandateHistoryModel.create(body);
      return mandateHistory;
    } catch (error) {
      throw new Error(error);
    }
  }
  async updateIapMandateStatus(id, data) {
    try {
      let updateStatus = await this.mandateHistoryModel.updateMany(
        { "metaData.externalId": id },
        { $set: { mandateStatus: data.status, updatedAt: data.updatedAt } }
      );
      return updateStatus;
    } catch (err) {
      throw err;
    }
  }
  async updateIapMandateStatusCancel(id, data) {
    try {
      let updateStatus = await this.mandateHistoryModel.updateMany(
        { mandateId: id },
        { $set: { mandateStatus: data.status, updatedAt: data.updatedAt } }
      );
      return updateStatus;
    } catch (err) {
      throw err;
    }
  }
  async getMandateHistoryByMandateId(token, status){
    try {
      let mandateHistory = await this.mandateHistoryModel.findOne({
        "metaData.externalId": token,
        mandateStatus: status,
      });
      return mandateHistory;
    } catch (error) {
      throw error;
    }
  }
}
