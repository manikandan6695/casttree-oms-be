import * as mongoose from "mongoose";
import { ESStatus, EStatus } from "src/shared/enum/privacy.enum";
import { IApplicationTypeModel } from "./app-type.schema";
// import { IApplicationModel } from "./application.schema";

export interface IAppFieldValueModel {
  field_key: string;
  field_value: string;
}

export interface IApplicationCredentialModel extends mongoose.Document {
  type_id: string | IApplicationTypeModel;
  application_id: any;
  type_key: string;
  application_key: string;
  field_values: IAppFieldValueModel[];
  status: EStatus;
  is_primary: boolean;
  created_by?: string ;
  updated_by?: string;
  product_key: string;
}

export const AppFieldValueSchema = new mongoose.Schema({
  field_value: { type: String },
  field_key: { type: String },
});

export const ApplicationCredentialSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
    },
    type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "applicationType",
    },
    application_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "application",
    },
    type_key: {
      type: String,
    },
    application_key: {
      type: String,
    },
    field_values: [AppFieldValueSchema],
    is_primary: {
      type: Boolean,
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
    product_key: {
      type: String,
    },
  },
  {
    collection: "applicationCredential",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
