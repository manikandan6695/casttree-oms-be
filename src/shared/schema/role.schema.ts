import mongoose from "mongoose";

export interface IRole {
  role_name: string;
  role_description: string;
  status: string;
  is_default: boolean;
  is_system: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface IRoleModel extends IRole, mongoose.Document {}

export const RoleSchema = new mongoose.Schema<IRoleModel>(
  {
    role_name: {
      type: String,
      required: true,
      trim: true,
    },
    role_description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Deleted"],
      default: "Active",
    },
    is_default: {
      type: Boolean,
      default: false,
    },
    is_system: {
      type: Boolean,
      default: false,
    },
  },
  {
    collection: "role",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
