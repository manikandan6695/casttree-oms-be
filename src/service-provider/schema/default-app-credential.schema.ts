import * as mongoose from "mongoose";
import { ESStatus, EStatus } from "src/shared/enum/privacy.enum";
import {
  AppFieldValueSchema,
  IAppFieldValueModel,
} from "./app-credential.schema";
import { IApplicationTypeModel } from "./app-type.schema";

export interface IDefaultApplicationCredentialModel extends mongoose.Document {
  product_key: string;
  type_id: string | IApplicationTypeModel;
  application_id: any;
  type_key: string;
  application_key: string;
  field_values: IAppFieldValueModel[];
  is_primary: boolean;
  status: EStatus;
}

export const DefaultApplicationCredentialSchema = new mongoose.Schema(
  {
    product_key: {
      type: String,
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
  },
  {
    collection: "defaultApplicationCredential",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
