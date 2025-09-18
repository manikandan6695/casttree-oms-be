import mongoose from "mongoose";

export interface processModel {
parentProcessId : string;
processMetaData : any;
status : string;
}

export const processSchema = new mongoose.Schema<any>({
    parentProcessId: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "process",
        },
    ],
    processMetaData: { type: mongoose.Schema.Types.Mixed },
    status:{type: String}
},
{
    collection: "process",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
}
);

// Indexes for process lookups
processSchema.index({ status: 1 });
processSchema.index({ parentProcessId: 1 });