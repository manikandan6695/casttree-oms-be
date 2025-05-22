import * as mongoose from "mongoose";

export interface ISystemConfigurationModel extends mongoose.Document {
  name: string;
  key: string;
  value: any;
  is_org_applicable: boolean;

}

export const SystemConfigurationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed },
    is_org_applicable: { type: Boolean },
 
  },
  {
    collection: "systemConfiguration",
  }
);
