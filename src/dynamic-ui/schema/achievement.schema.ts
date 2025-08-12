import * as mongoose from "mongoose";
export interface IAchievementModel extends mongoose.Document {
    name: string;
    key : string;
    type : string;
    metaData : any;
    status: string;
    sourceId: string;
    sourceType: string;
    visibilityStatus: boolean;
    provider: string;
    version: number;
    validityPeriod: string;
    description: string;
}
export const achievementSchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
        key: {
            type: String,
        },
        type: {
            type: String,
        },
        metaData: {
            type: mongoose.Schema.Types.Mixed,
        },
        status: {
            type: String,
        },
        sourceId: {
            type: String,
        },
        sourceType: {
            type: String,
        },
        visibilityStatus: {
            type: Boolean,
        },
        version: {
            type: Number,
        },
        validityPeriod: {
            type: Date,
        },
        provider: {
            type: String,
        },
        description: {
            type: String,
        },
    },
    {
        collection: "achievement",
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
);