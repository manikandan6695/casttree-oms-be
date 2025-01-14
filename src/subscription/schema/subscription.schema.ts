import * as mongoose from "mongoose";
import { IUserModel } from "src/user/schema/user.schema";
export interface ISubscriptionModel extends mongoose.Document {
  userId: string | IUserModel;
  planId: string;
  totalCount: number;
  currentStart: Date;
  quantity: number;
  currentEnd: Date;
  startAt: Date;
  scheduleChangeAt: string;
  endAt: Date;
  paidCount: number;
  expireBy: Date;
  notes: any;
  subscriptionStatus: string;
  status: string;
  createdBy: string | IUserModel;
  updatedBy: string | IUserModel;
}
export const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    planId: {
      type: String,
    },
    totalCount: {
      type: Number,
    },
    currentStart: {
      type: Date,
    },
    quantity: {
      type: Number,
    },
    currentEnd: { type: Date },
    startAt: {
      type: Date,
    },
    scheduleChangeAt: {
      type: String,
    },
    endAt: {
      type: Date,
    },
    paidCount: {
      type: Number,
    },
    expireBy: {
      type: Date,
    },
    notes: {
      type: mongoose.Schema.Types.Mixed,
    },
    subscriptionStatus: {
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
    collection: "subscription",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
