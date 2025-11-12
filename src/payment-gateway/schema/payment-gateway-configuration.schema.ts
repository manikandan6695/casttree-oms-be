import * as mongoose from "mongoose";

export interface IPaymentGatewayConfigurationModel extends mongoose.Document {
  paymentType: string;
  device: string;
  instrument: string;
  gateway: string;
  priority: number;
  status: string;
  isHealthy: boolean;
  lastHealthUpdate: Date;
  healthUpdatedBy: string;
  healthReason: string;
  displayName: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export const PaymentGatewayConfigurationSchema = new mongoose.Schema(
  {
    paymentType: {
      type: String,
      required: true,
      enum: ["payments", "subscription"],
    },
    device: {
      type: String,
      required: true,
      enum: ["android", "ios", "web"],
    },
    instrument: {
      type: String,
      required: true,
      enum: [
        "gpay",
        "phonepe",
        "paytm",
        "amazonpay",
        "card",
        "upi",
        "netbanking",
        "wallet",
      ],
    },
    gateway: {
      type: String,
      required: true,
      enum: ["phonepe", "razorpay", "cashfree"],
    },

    // Configuration
    priority: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive"],
      default: "active",
    },

    // Health Status
    isHealthy: {
      type: Boolean,
      required: true,
      default: true,
    },
    lastHealthUpdate: {
      type: Date,
      default: Date.now,
    },
    healthUpdatedBy: {
      type: String,
      enum: ["manual", "webhook"],
      default: "manual",
    },
    healthReason: {
      type: String,
      default: "All good",
    },

    // Display Metadata (UI)
    displayName: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
  },
  {
    collection: "paymentGatewayConfiguration",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

PaymentGatewayConfigurationSchema.index({ paymentType: 1, device: 1 });
PaymentGatewayConfigurationSchema.index({ gateway: 1, instrument: 1 });
PaymentGatewayConfigurationSchema.index({ status: 1, priority: 1 });
PaymentGatewayConfigurationSchema.index({ isHealthy: 1 });

