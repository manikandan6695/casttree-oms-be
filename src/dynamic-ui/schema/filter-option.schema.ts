import mongoose, { Document } from "mongoose";

export interface IFilterType extends Document {
    filterTypeId: string;
    filterType: string;
    optionKey: string;
    optionValue: string;
    description: string;
    icon: string;
    color: string;
    status: string;
    sortOrder: number;
    metaData: any;
    createdAt: Date;
    updatedAt: Date;
}
export const FilterOptionSchema = new mongoose.Schema({
    filterTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "filterTypes" },
    filterType: { type: String},
    optionKey: { type: String },
    optionValue: { type: String },
    description: { type: String },
    icon: { type: String },
    color: { type: String },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    sortOrder: { type: Number },
    metaData: {
        type: mongoose.Schema.Types.Mixed,
    }
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "filterOptions",
});