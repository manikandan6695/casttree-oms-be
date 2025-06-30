import mongoose from "mongoose";

export interface IBannerConfiguration extends mongoose.Document {
  banner: any;
  navigation: any;
  key: string;
  status: string;
}

export const BannerConfigurationSchema = new mongoose.Schema(
  {
    banner: { type: mongoose.Schema.Types.Mixed },
    navigation: { type: mongoose.Schema.Types.Mixed },
    key: { type: String },
    status: {
      type: String,
      default: "Active",
    },
  },
  {
    collection: "bannerConfiguration",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
