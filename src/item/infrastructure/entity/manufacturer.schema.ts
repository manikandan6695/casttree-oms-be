import * as mongoose from "mongoose";
import { MediaSchema } from "src/item/schema/item.schema";
import { ESstatus, Estatus } from "../../interface/enums/status.enum";

export interface IManufacturer extends mongoose.Document {
  organization_id: mongoose.Types.ObjectId;
  manufacturer_name: string;
  manufacturer_description?: string;
  media: any;
  status?: Estatus;
  created_by: string;
  updated_by: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export const ManufacturerSchema = new mongoose.Schema<any>(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
    },
    manufacturer_name: {
      type: String,
    },
    manufacturer_description: {
      type: String,
    },
    media: [MediaSchema],
    status: { type: String, enum: ESstatus, default: "Active" },
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
    collection: "manufacturer",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
