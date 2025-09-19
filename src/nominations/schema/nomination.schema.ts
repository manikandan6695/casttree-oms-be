import * as mongoose from "mongoose";

// Interface for Nomination Tags
export interface INominationTag {
  categoryId: mongoose.Types.ObjectId;
  categoryName: string;
  iconName: string;
  categoryType: string;
  iconMediaUrl: string;
}

// Interface for Nomination Media
export interface INominationMedia {
  type: string;
  media_id: mongoose.Types.ObjectId;
}

// Main Nomination Interface
export interface INominationModel extends mongoose.Document {
  projectId: mongoose.Types.ObjectId;
  tags: INominationTag[];
  awardId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  nomineeName: string;
  nomineePhoneNumber: string;
  nomineeEmail: string;
  nomineeDescription: string;
  nominationStatus: string;
  status: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  media: INominationMedia[];
  documentNumber: string;
  created_at: Date;
  updated_at: Date;
  rewardDescription: string;
  position: number;
}

// Tag Schema
export const NominationTagSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
    required: true,
    description: "Reference to category",
  },
  categoryName: {
    type: String,
    required: true,
    description: "Name of the category",
  },
  iconName: {
    type: String,
    required: true,
    description: "Icon name for the category",
  },
  categoryType: {
    type: String,
    required: true,
    description: "Type of category (e.g., specialMention)",
  },
  iconMediaUrl: {
    type: String,
    required: true,
    description: "URL of the icon media",
  },
});

// Media Schema
export const NominationMediaSchema = new mongoose.Schema({
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

// Main Nomination Schema
export const NominationSchema = new mongoose.Schema<INominationModel>(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "project",
      required: true,
      description: "Reference to project",
    },
    tags: [NominationTagSchema],
    awardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "award",
      required: true,
      description: "Reference to award",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      description: "Reference to user who created the nomination",
    },
    nomineeName: {
      type: String,
      required: true,
      description: "Name of the nominee",
    },
    nomineePhoneNumber: {
      type: String,
      required: true,
      description: "Phone number of the nominee",
    },
    nomineeEmail: {
      type: String,
      description: "Email address of the nominee",
    },
    nomineeDescription: {
      type: String,
      default: null,
      description: "Description of the nominee",
    },
    nominationStatus: {
      type: String,
      required: true,
      default: "Pending",
      enum: ["Pending", "Approved", "Rejected", "Under Review"],
      description: "Status of the nomination",
    },
    status: {
      type: String,
      required: true,
      default: "Active",
      enum: ["Active", "Inactive", "Draft"],
      description: "Current status of the nomination record",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      description: "User who created the nomination",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      description: "User who last updated the nomination",
    },
    media: [NominationMediaSchema],
    documentNumber: {
      type: String,
      required: true,
      unique: true,
      description: "Unique document number for the nomination (e.g., NOM00232)",
    },
    rewardDescription: {
      type: String,
      required: true,
      description: "Reward description for the nomination",
    },
    position: {
      type: Number,
      required: true,
      description: "Position of the nomination",
    },
  },
  {
    collection: "nominations",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Create and export the model
export const NominationModel = mongoose.model<INominationModel>(
  "Nomination",
  NominationSchema
);
