import * as mongoose from "mongoose";

export interface IEndorsementModel extends mongoose.Document {
  endorsedBy: string;
  description: string;
  relationship: string;
  endorseTo: string;
}
export const endorsementSchema = new mongoose.Schema(
  {
    endorsedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    description: {
      type: String,
    },
    relationship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },
    endorsedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    collection: "endorsement",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
