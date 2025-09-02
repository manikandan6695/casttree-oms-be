import mongoose from "mongoose";

export interface ISkill {
  skill_name: string;
  status: string;
  role: mongoose.Types.ObjectId[];
  created_at?: Date;
  updated_at?: Date;
  __v?: number;
}

export interface ISkillModel extends ISkill, mongoose.Document {}

export const SkillsSchema = new mongoose.Schema<ISkillModel>({
  skill_name: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ["Active", "Inactive", "Deleted"],
    default: "Active"
  },
  role: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "role"
  }]
}, {
  collection: "skills",
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
});
