import * as mongoose from "mongoose";
import { IItemModel } from "src/item/schema/item.schema";
import { IPlatformItemModel } from "src/item/schema/platform-item.schema";
import { IServiceRequestModel } from "src/service-request/schema/serviceRequest.schema";

export interface IServiceResponseModel extends mongoose.Document {
  itemId: IItemModel | string;
  requestId: IServiceRequestModel | string;
  standardResponse: any;
  customQuestionResponse: any;
  overAllRatings: number;
  feedbackStatus: string;
  feedbackStatusHistory: string[];
  additionalDetail: any;
  status: string;
  createdBy: any;
  updatedBy: any;
}

export const additionalDetailSchema = new mongoose.Schema<any>({
  isPassed: {
    type: Boolean,
  },
});
export const serviceResponseSchema = new mongoose.Schema<any>(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "item",
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "serviceRequest",
    },
    standardResponse: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],
    customQuestionResponse: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],
    overAllRatings: {
      type: Number,
    },
    feedbackStatus: {
      type: String,
    },
    feedbackStatusHistory: [
      {
        type: String,
      },
    ],
    additionalDetail: additionalDetailSchema,
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
    collection: "serviceResponse",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
