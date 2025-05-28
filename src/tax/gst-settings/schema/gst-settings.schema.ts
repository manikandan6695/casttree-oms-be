import * as mongoose from "mongoose";
import { ESStatus, EStatus } from "src/shared/enum/privacy.enum";
export interface IGSTSettingsModel extends mongoose.Document {
  organization_id: any;
  gstin: string;
  business_location: any;
  status: EStatus;
  gst_reg_on: Date | string;
  reverse_charges: boolean;
  composition_scheme: boolean;
  composition_scheme_percentage: number;
  composition_scheme_value: string;
  import_export: boolean;
  custom_duty_tracking_account: any;
  digital_services: boolean;
  created_by: any;
  updated_by: any;
}
export const GSTSettingsSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
    },
    gstin: {
      type: String,
    },
    business_location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "state",
    },
    composition_scheme: {
      type: Boolean,
    },
    composition_scheme_percentage: {
      type: Number,
    },
    composition_scheme_value: {
      type: String,
    },
    status: {
      type: String,
      enum: ESStatus,
      default: EStatus.Active,
    },
    gst_reg_on: {
      type: Date,
    },
    reverse_charges: {
      type: Boolean,
    },
    import_export: {
      type: Boolean,
    },
    custom_duty_tracking_account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
    },
    digital_services: {
      type: Boolean,
    },
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
    collection: "gstSettings",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
