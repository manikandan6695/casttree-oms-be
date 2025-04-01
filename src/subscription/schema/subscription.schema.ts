import * as mongoose from "mongoose";
export interface ISubscriptionModel extends mongoose.Document {
  userId: string;
  planId: string;
  totalCount: number;
  currentStart: Date;
  quantity: number;
  currentEnd: Date;
  startAt: Date;
  amount: number;
  providerId: number;
  scheduleChangeAt: string;
  endAt: Date;
  paidCount: number;
  expireBy: Date;
  notes: any;
  subscriptionStatus: string;
  metaData: any;
  status: string;
  createdBy: string;
  updatedBy: string;
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
    providerId: {
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
    amount: {
      type: Number,
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
    metaData: {
      type: mongoose.Schema.Types.Mixed,
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
