import * as mongoose from "mongoose";
import { IMedia, MediaSchema } from "src/item/schema/platform-item.schema";

export interface ICommentModel extends mongoose.Document {
  organization_id: string;
  product_key: string;
  source_id?: any;
  source_type?: string;
  comment_description?: string;
  parent_comment_id?: any;
  comment_status: string;
  created_by?: any;
  comment_media?: IMedia[];
}

export const CommentSchema = new mongoose.Schema<any>(
  {
    organization_id: { type: mongoose.Schema.Types.ObjectId },
    product_key: {
      type: String,
    },
    source_id: { type: mongoose.Schema.Types.ObjectId },
    source_type: { type: String },
    comment_description: { type: String },
    comment_status: { type: String },
    parent_comment_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    created_by: { type: mongoose.Schema.Types.ObjectId },
    comment_media: [MediaSchema],
  },
  {
    collection: "comments",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
