import * as mongoose from "mongoose";
import { ITaxTypeModel } from "./tax-type.schema";

export interface ITaxModel extends mongoose.Document {
  organization_id: any;
  tax_name: string;
  type: string;
  tax_rate: number;
  tax_type: string | ITaxTypeModel;
  taxes: any;
  created_by: any;
  updated_by: any;
}

export const TaxSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
    },
    tax_name: {
      type: String,
    },
    type: {
      type: String,
      example: "Single,Group",
    },
    tax_rate: {
      type: Number,
    },
    tax_type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "taxType",
    },
    taxes: [{ type: mongoose.Schema.Types.ObjectId, ref: "tax" }],
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
    collection: "tax",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
