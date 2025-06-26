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
  navigation: any;
  tag: any;
  media: any;
  banner: any;
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
    },
    type: { type: String, enum: ["dynamic", "static"], default: "dynamic" },
    title: String,
    subtitle: String,
    order: Number,
    banner: { type: String },
    tag: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    actionData: {
      type: mongoose.Schema.Types.Mixed,
    },
    metaData: { type: mongoose.Schema.Types.Mixed },
    navigation: {
      type: {
        type: String,
      },
      pageId: { type: mongoose.Schema.Types.ObjectId },
      url: String,
      target: { type: String, enum: ["_self", "_blank"], default: "_self" },
      params: mongoose.Schema.Types.Mixed,
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
