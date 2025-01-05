import mongoose from "mongoose";

export interface errorResponseModel {
    code: string;
    message: string;
}
export const errorResponseSchema = new mongoose.Schema<any>({
    code: { type: String },
    message: { type: String }
}
    ,
    {
        collection: "errorResponses",
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    });
