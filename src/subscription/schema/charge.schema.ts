import * as mongoose from "mongoose";

export interface IChargeModel extends mongoose.Document {
  chargeId: mongoose.Types.ObjectId;
  userId: string;
  subscriptionId: string;
  mandateId: string;
  amount: number;
  provider: "cashfree" | "razorpay" | "phonepe";
  itemId: string;
  processingStatus: "scheduled" | "processing" | "failed" | "completed";
  remarks: string;
  chargeInitiatedDate: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const chargeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subscription",
      required: true,
    },
    mandateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mandates",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    provider: {
      type: String,
      enum: ["cashfree", "razorpay", "phonepe"],
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "item",
      required: true,
    },
    processingStatus: {
      type: String,
      enum: ["scheduled", "processing", "failed", "completed"],
      default: "scheduled",
      required: true,
    },
    remarks: {
      type: String,
      default: "",
    },
    chargeInitiatedDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    collection: "charges",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

// Index for efficient querying
chargeSchema.index({ processingStatus: 1, chargeInitiatedDate: 1 });
chargeSchema.index({ userId: 1 });
chargeSchema.index({ subscriptionId: 1 });

