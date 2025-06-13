import mongoose, { Document } from "mongoose";

export interface IComponent extends Document {
  componentKey: string;
  displayType: string;
  type: string;
  title: string;
  subtitle: string;
  order: number;
  status: string;
  actionData: any;
  metaData: Record<string, any>;
  navigation: {
    type: string;
    pageId?: mongoose.Types.ObjectId;
    url?: string;
    target: string;
    params?: Record<string, any>;
    modalContent?: Record<string, any>;
  };
  media: Array<{
    mediaId: mongoose.Types.ObjectId;
    mediaUrl: string;
    type: "image" | "video";
  }>;
  createdBy: any;
  updatedBy: any;
  created_at: Date;
  updated_at: Date;
}

export const ComponentSchema = new mongoose.Schema(
  {
    componentKey: { type: String, required: true },
    displayType: {
      type: String,
      enum: ["banner", "carousel", "list", "grid"],
      default: "list",
    },
    type: { type: String, enum: ["dynamic", "static"], default: "dynamic" },
    title: String,
    subtitle: String,
    order: Number,
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    actionData: {
      type: mongoose.Schema.Types.Mixed,
    },
    metaData: { type: mongoose.Schema.Types.Mixed },
    navigation: {
      type: {
        type: String,
        enum: [
          "internal",
          "external",
          "deeplink",
          "whatsapp",
          "payment",
          "series",
          "modal",
        ],
        required: true,
      },
      pageId: { type: mongoose.Schema.Types.ObjectId },
      url: String,
      target: { type: String, enum: ["_self", "_blank"], default: "_self" },
      params: mongoose.Schema.Types.Mixed,
      modalContent: mongoose.Schema.Types.Mixed,
    },
    media: [
      {
        mediaId: { type: mongoose.Schema.Types.ObjectId },
        mediaUrl: String,
        type: { type: String, enum: ["image", "video"] },
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "component",
  }
);
