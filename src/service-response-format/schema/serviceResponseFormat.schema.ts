import * as mongoose from "mongoose";
import { IPlatformItemModel } from "src/item/schema/platform-item.schema";

export interface IServiceResponseFormatModel extends mongoose.Document {
  platformItemId: IPlatformItemModel | string;
  question: string;
  answerType: any;
  status: string;
  createdBy: any;
  updatedBy: any;
}
export const serviceResponseFormatSchema = new mongoose.Schema<any>(
  {
    platformItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "platformItem",
    },
    question: {
      type: String,
    },
    answerType: {
      type: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.Mixed,
    },
    updatedBy: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    collection: "serviceResponseFormat",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
