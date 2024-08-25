import * as mongoose from "mongoose";

export interface IDateFormatModel extends mongoose.Document {
  display_name: string;
  db_format_key?: string;
  web_format_key?: string;
}

export const DateFormatSchema = new mongoose.Schema(
  {
    display_name: { type: String, required: true },
    db_format_key: { type: String },
    web_format_key: { type: String },
  },
  {
    collection: "dateFormat",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
