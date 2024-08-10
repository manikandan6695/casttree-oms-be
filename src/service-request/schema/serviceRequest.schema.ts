import * as mongoose from "mongoose";
import { IItemModel, MediaSchema } from "src/item/schema/item.schema";
import { IMedia } from "src/item/schema/platform-item.schema";
export interface IAdditionalDataModel {
  nominationId: string;
}
export interface IServiceRequestModel extends mongoose.Document {
  requestId: string;
  itemId: string | IItemModel;
  requestedBy: any;
  requestedByOrg: any;
  requestedToOrg: any;
  requestedToUser: any;
  projectId: any;
  additionalDetail: IAdditionalDataModel;
  media: IMedia[];
  customQuestions: any;
  addons: any;
  requestStatus: string;
  serviceDueDate: Date;
  status: string;
  createdBy: any;
  updatedBy: any;
}
export const additionalDataSchema = new mongoose.Schema<any>({
  nominationId: {
    type: mongoose.Schema.Types.Mixed,
  },
});
export const serviceRequestSchema = new mongoose.Schema<any>(
  {
    requestId: {
      type: String,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "item",
    },
    requestedBy: {
      type: mongoose.Schema.Types.Mixed,
    },
    requestedByOrg: {
      type: mongoose.Schema.Types.Mixed,
    },
    requestedToOrg: {
      type: mongoose.Schema.Types.Mixed,
    },
    requestedToUser: {
      type: mongoose.Schema.Types.Mixed,
    },
    projectId: {
      type: mongoose.Schema.Types.Mixed,
    },
    additionalDetail: additionalDataSchema,
    media: [MediaSchema],
    customQuestions: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],
    addons: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],
    requestStatus: {
      type: String,
    },
    serviceDueDate: {
      type: Date,
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
    collection: "serviceRequest",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
