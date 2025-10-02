import mongoose from "mongoose";

export interface IOrganization {
  organizationName: string;
  primaryPhoneNumber: string;
  billingAddress?: any;
  cityAddress?: any;
  city: mongoose.Types.ObjectId;
  phoneCountryCode: string;
  phoneNumber: string;
  state: mongoose.Types.ObjectId;
  created_at?: Date;
  updated_at?: Date;
}

export interface IOrganizationModel extends IOrganization, mongoose.Document {}

export const OrganizationSchema = new mongoose.Schema<IOrganizationModel>(
  {
    organizationName: {
      type: String,
      required: true,
      trim: true,
    },
    primaryPhoneNumber: {
      type: String,
      required: true,
    },
    billingAddress: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    cityAddress: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "city",
      required: true,
    },
    phoneCountryCode: {
      type: String,
      required: true,
      default: "+91",
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "state",
      required: true,
    },
  },
  {
    collection: "organization",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Add indexes for better query performance
OrganizationSchema.index({ organizationName: 1 });
OrganizationSchema.index({ phoneNumber: 1 });
OrganizationSchema.index({ city: 1 });
OrganizationSchema.index({ state: 1 });
