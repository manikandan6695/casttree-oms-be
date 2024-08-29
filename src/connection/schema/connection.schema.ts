import { IProfileModel } from "src/profile/schema/profile.schema";
import * as mongoose from "mongoose";
import { IUserModel } from "src/user/schema/user.schema";
import { EStatus } from "src/shared/enum/privacy.enum";

export interface IConnectionModel extends mongoose.Document {
  requestorProfileId: string | IProfileModel;
  receiverProfileId: string | IProfileModel;
  connectionStatus: string;
  type: string;
  status: string;
  createdBy: string | IUserModel;
  updatedBy: string | IUserModel;
}
export const connectionSchema = new mongoose.Schema(
  {
    requestorProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "profile",
    },
    receiverProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "profile",
    },
    connectionStatus: {
      type: String,
    },
    type: {
      type: String,
    },
    status: {
      type: String,
      default: EStatus.Active,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    collection: "connection",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
