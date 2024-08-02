import * as mongoose from "mongoose";

export interface ITimeZoneModel extends mongoose.Document {
  value: string;
  abbr: string;
  offset: number;
  isdst: boolean;
  text: string;
  utc: string[];
  is_default: boolean;
}

export const TimeZoneSchema = new mongoose.Schema(
  {
    value: { type: String },
    abbr: { type: String },
    offset: { type: Number },
    isdst: { type: Boolean },
    text: { type: String },
    utc: [{ type: String }],
    is_default: { type: Boolean },
  },
  {
    collection: "timeZone",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
