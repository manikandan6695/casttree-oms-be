import * as mongoose from "mongoose";

// Interface for Award Media
export interface IAwardMedia {
  type: string;
  media_id: mongoose.Types.ObjectId;
}

// Interface for Award Tax
export interface IAwardTax {
  [key: string]: any; // Flexible tax structure
}

// Main Award Interface
export interface IAwardModel extends mongoose.Document {
  title: string;
  description: string;
  awardType: string;
  price: string;
  currency: string;
  tax: IAwardTax;
  media: IAwardMedia[];
  status: string;
  category: mongoose.Types.ObjectId;
  subtitle: string;
  itemId: mongoose.Types.ObjectId;
  sequencePrefix: string;
  created_at: Date;
  updated_at: Date;
}

// Media Schema
export const AwardMediaSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    description: "Type of media (e.g., display_picture, banner, etc.)",
  },
  media_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "media",
    required: true,
  },
});

// Main Award Schema
export const AwardSchema = new mongoose.Schema<IAwardModel>(
  {
    title: {
      type: String,
      required: true,
      description: "Award title",
    },
    description: {
      type: String,
      required: true,
      description: "Detailed description of the award",
    },
    awardType: {
      type: String,
      required: true,
      description: "Type of award (e.g., Group, Individual)",
    },
    price: {
      type: String,
      required: true,
      description: "Price of the award",
    },
    currency: {
      type: String,
      required: true,
      description: "Currency code (e.g., INR, USD)",
    },
    tax: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      description: "Tax information for the award",
    },
    media: [AwardMediaSchema],
    status: {
      type: String,
      required: true,
      default: "Active",
      enum: ["Active", "Inactive", "Draft"],
      description: "Current status of the award",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: true,
      description: "Reference to award category",
    },
    subtitle: {
      type: String,
      description: "HTML formatted subtitle with additional details",
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "item",
      required: true,
      description: "Reference to associated item",
    },
    sequencePrefix: {
      type: String,
      required: true,
      description: "Prefix for award sequence (e.g., SING)",
    },
  },
  {
    collection: "awards",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Create and export the model
export const AwardModel = mongoose.model<IAwardModel>("Award", AwardSchema);
