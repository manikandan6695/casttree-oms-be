import mongoose, { Document } from "mongoose";

export interface IFilter {
  category: string;
  values: string[];
}
export interface IUserFilterPreference extends Document {
  userId: string;
  filters: IFilter[];
  isLatest: boolean;
  status : string;
  createdAt: Date;
  updatedAt: Date;
}
export const UserFilterPreferenceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId,  ref: "user" },
   filters: [
      {
        category: { type: String },
        values: [{ type: String }],
      },
    ],
    isLatest: { type: Boolean },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    }, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "userFilterPreferences",
})