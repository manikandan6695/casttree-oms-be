import * as mongoose from "mongoose";
import { IItemModel, MediaSchema } from "src/item/schema/item.schema";
import { IMedia } from "src/item/schema/platform-item.schema";
import { EStatus } from "src/shared/enum/privacy.enum";
import {
  EServiceRequestStatus,
  ESSourceType,
  EVisibilityStatus,
} from "../enum/service-request.enum";

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
  sourceId: any;
  sourceType: string;
  additionalDetail: IAdditionalDataModel;
  media: IMedia[];
  customQuestions: any;
  visibilityStatus?: string;
  addons: any;
  requestStatus: string;
  serviceDueDate: Date;
  type: string;
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
    sourceId: { type: mongoose.Schema.Types.ObjectId, refPath: "sourceType" },
    sourceType: { type: String, enum: ESSourceType },
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
    visibilityStatus: {
      type: String,
      default: EVisibilityStatus.locked,
    },
    requestStatus: {
      type: String,
      default: EServiceRequestStatus.initiated,
    },
    serviceDueDate: {
      type: Date,
    },
    type:{
      type:String
    },
    status: {
      type: String,
      default: EStatus.Active,
    },
    createdBy: {
      type: mongoose.Schema.Types.Mixed,
    },
    updatedBy: {
      type: mongoose.Schema.Types.Mixed,
    }

  },
  {
    collection: "serviceRequest",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },



);
serviceRequestSchema.virtual("languages", {
  ref: "serviceitems",
  localField: "itemId",
  foreignField: "itemId",
  justOne: true
});

serviceRequestSchema.set("toJSON", { virtuals: true });

