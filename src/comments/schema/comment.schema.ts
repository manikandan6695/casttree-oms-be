import * as mongoose from "mongoose";
import { IMedia, MediaSchema } from "src/item/schema/platform-item.schema";

export interface ICommentModel extends mongoose.Document {
  sourceId: string;
  sourceType?: string;
  commentDescription?: string;
  commentStatus: string;
  createdBy?: any;
  updatedBy?: any;
}

export const CommentSchema = new mongoose.Schema<any>(
  {
    sourceId: { type: mongoose.Schema.Types.ObjectId },
    sourceType: { type: String },
    commentDescription: { type: String },
    commentStatus: { type: String, default: "Active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId },
    updatedBy: { type: mongoose.Schema.Types.ObjectId },
  },
  {
    collection: "comments",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
