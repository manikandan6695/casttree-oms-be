import * as mongoose from "mongoose";

export interface IConfigurationModel extends mongoose.Document {
  organization_id: any;
  configurations?: any;
  discount_level: string;
  status?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: Date;
  updated_at?: Date;
}

export const ConfigurationSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
    },
    configurations: {
      type: mongoose.Schema.Types.Mixed,
    },
    status: { type: String },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
    },
  },
  {
    collection: "configuration",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
