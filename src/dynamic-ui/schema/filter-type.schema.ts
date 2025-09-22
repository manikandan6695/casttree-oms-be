import mongoose, { Document } from "mongoose";

export interface IValidationRules {
    required: boolean;
    minSelections: number;
    maxSelections: number;
}
export interface ISource {
    sourceId: string;
}

export interface IFilterType extends Document {
    type: string;
    displayName: string;
    discription: string;
    dataType: string;
    isActive: boolean;
    sortOrder: number;
    validationRules: IValidationRules;
    source: ISource[];
    createdAt: Date;
    updatedAt: Date;
}
export const validationRulesSchema = new mongoose.Schema({
    required: { type: Boolean },
    minSelections: { type: Number },
    maxSelections: { type: Number },
},{_id:false})

export const sourceSchema = new mongoose.Schema({
    sourceId: { type: mongoose.Schema.Types.ObjectId, ref: "component" }
},{_id:false})

export const FilterTypeSchema = new mongoose.Schema(
  {
    type: { type: String },
    displayName: { type: String },
    discription: { type: String },
    dataType: { type: String },
    isActive: { type: Boolean },
    sortOrder: { type: Number },
    validationRules: validationRulesSchema,
    source: [sourceSchema],
},{
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "filterTypes",
  }
);

// Indexes for quick filter type queries
FilterTypeSchema.index({ isActive: 1, sortOrder: 1 });
FilterTypeSchema.index({ type: 1 });