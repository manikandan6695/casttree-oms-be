import mongoose from "mongoose";

export interface ISkillsModel {
  skillName: string;
  skillDescription?: string;
  status?: string;
  category?: string;
}

export const skillsSchema = new mongoose.Schema<any>({
  skillName: {
    type: String,
    required: true,
  },
  skillDescription: {
    type: String,
  },
  status: {
    type: String,
    default: "active",
  },
  category: {
    type: String,
  },
}, {
  timestamps: true,
});

export default skillsSchema;
