import mongoose from "mongoose";

export interface processModel {
parentProcessId : string;
processMetaData : any;
status : string;
}

export const processSchema = new mongoose.Schema<any>(
  {
    parentProcessId: {
      type: String, // Changed from array to String
      default: "null", // Default value
    },
    processMetaData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}, // This ensures an empty object is always created
    },
    status: { type: String },
  },
  {
    collection: "process",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Indexes for process lookups
processSchema.index({ status: 1 });
processSchema.index({ parentProcessId: 1 });
