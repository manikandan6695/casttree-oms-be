import * as mongoose from "mongoose";
import { ESStatus, EStatus } from "src/shared/enum/privacy.enum";

export interface IApplicationTypeModel extends mongoose.Document {
  type_name: string;
  type_key: string;
  short_description?: string;
  long_description?: string;
  status: EStatus;
  created_by?: string;
  updated_by?: string;
}

export const ApplicationTypeSchema = new mongoose.Schema(
  {
    type_name: {
      type: String,
      required: true,
    },
    type_key: {
      type: String,
      unique: true,
      required: true,
    },
    short_description: {
      type: String,
    },
    long_description: {
      type: String,
    },
    status: { type: String, enum: ESStatus, default: "Active" },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    collection: "applicationType",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
