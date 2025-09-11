import mongoose from "mongoose";

export interface IUserOrganization {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  status: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  created_at?: Date;
  updated_at?: Date;
}

export interface IUserOrganizationModel extends IUserOrganization, mongoose.Document {}

export const UserOrganizationSchema = new mongoose.Schema<IUserOrganizationModel>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "organization",
    required: true
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  }
}, {
  collection: "userOrganization",
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
});

// Add indexes for better query performance
UserOrganizationSchema.index({ userId: 1 });
UserOrganizationSchema.index({ organizationId: 1 });
UserOrganizationSchema.index({ userId: 1, organizationId: 1 }, { unique: true });
