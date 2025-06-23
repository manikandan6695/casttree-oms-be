import * as mongoose from "mongoose";
export interface ISubscriptionModel extends mongoose.Document {
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
export const webhookSchema = new mongoose.Schema(
  {
    transaction: {
      type: mongoose.Schema.Types.Mixed,
    },
    providerId: {
      type: Number,
    },
    provider: {
      type: String,
    },
    webhook: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    collection: "webhook",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
