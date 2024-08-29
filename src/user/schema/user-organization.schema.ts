import * as mongoose from "mongoose";
import { IOrganizationModel } from "src/organization/schema/organization.schema";
import { IRoleModel } from "src/role/schema/role.schema";
import { IUserModel } from "./user.schema";
export interface IUserOrganizationModel extends mongoose.Document {
  userId: IUserModel | string;
  organizationId: IOrganizationModel | string;
  status: string;
  role: IRoleModel | string;
  createdBy: IUserModel | string;
  updatedBy: IUserModel | string;
}
export const userOrganizationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "role",
    },
    status: {
      type: String,
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    autoIndex: true,
    collection: "userOrganization",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
