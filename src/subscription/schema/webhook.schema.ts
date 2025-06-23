import * as mongoose from "mongoose";
export interface IWebhookModel extends mongoose.Document {
  providerId: number;
  provider: string;
  transaction: any;
  webhookPayload: any;
  status: string;
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
    status: {
      type: String,
    },
    webhookPayload: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    collection: "webhook",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
