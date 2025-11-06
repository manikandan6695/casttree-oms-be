import mongoose from "mongoose";

export interface processInstanceDetailModel {
    processInstanceId: string;
    processId: string;
    taskId: string;
    taskResponse: string;
    taskStatus: string;
    triggeredAt: string;
    startedAt: string;
    endedAt: string;
    status: string;
    createdBy: string;
    updatedBy: string;
    watchedCount: number;
}
export const processInstanceDetailSchema = new mongoose.Schema<any>({
    processInstanceId: { type: mongoose.Schema.Types.ObjectId, ref: "processInstance" },
    processId: { type: mongoose.Schema.Types.ObjectId, ref: "process" },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "task" },
    taskResponse: { type: mongoose.Schema.Types.Mixed },
    taskStatus: { type: String },
    triggeredAt: { type: Date },
    startedAt: { type: Date },
    endedAt: { type: Date },
    status: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    watchedCount: { type: Number },
},
    {
        collection: "processInstanceDetail",
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    });
