import * as mongoose from "mongoose";
import { ESStatus, EStatus } from "src/dynamic-ui/interface/enums/status.enum";

export interface IVariantModel extends mongoose.Document {
  organization_id: string;
  variant_name: string;
  variant_code: string;
  status?: EStatus;
  created_by: string;
  updated_by: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export const VariantSchema = new mongoose.Schema<any>(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
    },
    variant_name: {
      type: String,
    },
    variant_code: {
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
    collection: "variant",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
