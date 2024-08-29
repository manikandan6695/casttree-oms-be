import * as mongoose from "mongoose";
import { IProfileModel } from "src/profile/schema/profile.schema";
import { IUserModel } from "src/user/schema/user.schema";

export interface IConnectionRequestModel extends mongoose.Document {
  requestorProfileId: string | IProfileModel;
  receiverProfileId: string | IProfileModel;
  requestStatus: string;
  requestStatusHistory: string[];
  type: string;
  status: string;
  createdBy: string | IUserModel;
  updatedBy: string | IUserModel;
}
export const connectionRequestSchema = new mongoose.Schema(
  {
    requestorProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "profile",
    },
    receiverProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "profile",
    },
    requestStatus: {
      type: String,
    },
    requestStatusHistory: [
      {
        type: String,
      },
    ],
    type: {
      type: String,
    },
    status: {
      type: String,
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
    collection: "connectionRequest",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
