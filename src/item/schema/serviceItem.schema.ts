import mongoose from "mongoose";
import {
  ILanguageModel,
  IskillModel,
  languageSchema,
  skillSchema,
} from "./language.schema";

export interface expertiseModel {
  category_id: string;
  name: string;
}
export const expertiseSchema = new mongoose.Schema<any>({
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
  },
  name: {
    type: String,
  },
});

// Add Category Schema
export interface categoryModel {
  name: string;
  filterOptionId: string;
}
export const categorySchema = new mongoose.Schema<any>({
  name: {
    type: String,
    required: true,
  },
  filterOptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "filterOptions",
    required: true,
  },
});

// Add Proficiency Schema
export interface proficiencyModel {
  name: string;
  filterOptionId: string;
}
export const proficiencySchema = new mongoose.Schema<any>({
  name: {
    type: String,
    required: true,
  },
  filterOptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "filterOptions",
    required: true,
  },
});

export interface serviceItemAdditionalDetailModel {
  processId: string;
  thumbnail: string;
  ctaName: string;
  navigationURL: string;
}
export const serviceItemAdditionalDetailSchema = new mongoose.Schema<any>({
  processId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "process",
  },
  parentProcessId: {
    // Add missing field
    type: mongoose.Schema.Types.ObjectId,
    ref: "process",
  },
  thumbnail: { type: String },
  ctaName: { type: String },
  navigationURL: { type: String },
});

export interface tagModel {
  category_id: string;
  name: string;
  order?: number;
}
export const tagSchema = new mongoose.Schema<any>({
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
  },
  name: {
    type: String,
  },
  order: {
    type: Number,
  },
});

export interface serviceitems {
  itemId: string;
  userId: string;
  skill: IskillModel;
  language: ILanguageModel[];
  status: string;
  respondTime: string;
  itemSold: number;
  type: string;
  expertise: expertiseModel;
  tag: tagModel;
  additionalDetails: serviceItemAdditionalDetailModel;
  priorityOrder: number;
  category: categoryModel[]; // Add category field
  proficiency: proficiencyModel[]; // Add proficiency field
}

export const serviceitemsSchema = new mongoose.Schema<any>(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "item",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    skill: {
      type: skillSchema,
    },
    respondTime: {
      type: String,
    },
    language: [languageSchema],
    status: {
      type: String,
    },
    itemSold: {
      type: Number,
    },
    type: {
      type: String,
    },
    expertise: [expertiseSchema],
    tag: [tagSchema],
    additionalDetails: serviceItemAdditionalDetailSchema,
    priorityOrder: {
      type: Number,
    },
    // Add the new fields
    category: [categorySchema], // Array of category objects
    proficiency: [proficiencySchema], // Array of proficiency objects
  },
  {
    collection: "serviceitems",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Indexes for frequent queries in DynamicUiService
serviceitemsSchema.index({ type: 1, status: 1 });
serviceitemsSchema.index({ "skill.skillId": 1 });
serviceitemsSchema.index({ "skill.skill_name": 1 });
serviceitemsSchema.index({ "additionalDetails.processId": 1 });
serviceitemsSchema.index({ "additionalDetails.parentProcessId": 1 });
serviceitemsSchema.index({ "tag.name": 1 });
serviceitemsSchema.index({ "tag.name": 1, "tag.order": 1 });
serviceitemsSchema.index({ "proficiency.filterOptionId": 1 });
serviceitemsSchema.index({ "category.filterOptionId": 1 });
serviceitemsSchema.index({ userId: 1 });