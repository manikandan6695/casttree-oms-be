import mongoose, { Document } from "mongoose";

export interface IContentPage extends Document {
  pageName: string;
  key: string;
  components: any[];
  bgColorCode: string;
  status: string;
  metaData: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export const ContentPageSchema = new mongoose.Schema(
  {
    pageName: { type: String, required: true },
    key: { type: String, required: true },
    components: [
      {
        componentId: { type: mongoose.Schema.Types.ObjectId },
      },
    ],
    bgColorCode: String,
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    metaData: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "contentPage",
  }
);
