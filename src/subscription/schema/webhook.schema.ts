import * as mongoose from "mongoose";
export interface ISubscriptionModel extends mongoose.Document {
  userId: string;
  planId: string;
  subscriptionId: string;
  totalCount: number;
  currentStart: Date;
  quantity: number;
  currentEnd: Date;
  startAt: Date;
  amount: number;
  providerId: number;
  provider: string;
  scheduleChangeAt: string;
  endAt: Date;
  paidCount: number;
  expireBy: Date;
  notes: any;
  subscriptionStatus: string;
  metaData: any;
  status: string;
  externalId: string;
  transactionDetails: {
    transactionId: string;
    originalTransactionId: string;
    authAmount: number;
    transactionDate: Date;
    planId: string;
  }; 
  currencyId: string;
  currencyCode: string;
  createdBy: string;
  updatedBy: string;
}
export const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    subscriptionId: {
      type: String,
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
    provider: {
      type: String,
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
    externalId: { type: String, unique: true },
    transactionDetails: {
      transactionId: { type: String, unique: true },
      originalTransactionId: { type: String },
      authAmount: { type: Number },
      transactionDate: { type: Date },
      planId: { type: String },
    },
    currencyId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    currencyCode: {
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
    collection: "webhook",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
