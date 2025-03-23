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
}
