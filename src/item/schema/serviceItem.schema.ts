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
export interface planItemIdModel {
  itemId: string;
  itemName: string;
}
export interface serviceItemRoleModel {
  roleId: string;
  roleName: string;
}
export interface serviceitems {
  itemId: string;
  userId: string;
  skill: IskillModel[];
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
  planItemId: planItemIdModel[];
  role: serviceItemRoleModel[];
}
export const planItemIdSchema = new mongoose.Schema<any>({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "item",
  },
  itemName: { type: String },
}, { _id: false });
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
    skill: [skillSchema],
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
    planItemId: [{
      type: planItemIdSchema
    }],
    role: [{
      roleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "role",
      },
      roleName: {
        type: String,
      },
    }],
  },
  {
    collection: "serviceitems",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

serviceitemsSchema.index({ "tag.name": 1 });