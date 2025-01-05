import mongoose from "mongoose";

export interface processInstanceDetailsModel {
    processInstanceId: string;
    processId: string;
    subprocessId: string;
    taskId: string;
    taskResponse: string;
    taskStatus: string;
    triggeredAt: string;
    startedAt: string;
    endedAt: string;
    status: string;
    createdBy: string;
    updatedBy: string;
}
export const processInstanceDetailsSchema = new mongoose.Schema<any>({
    processInstanceId: { type: mongoose.Schema.Types.ObjectId, ref: "processInstances" },
    processId: { type: mongoose.Schema.Types.ObjectId, ref: "processes" },
    subprocessId: { type: mongoose.Schema.Types.ObjectId, ref: "subprocess" },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "tasks" },
    taskResponse: { type: String },
    taskStatus: { type: String },
    triggeredAt: { type: Date },
    startedAt: { type: Date },
    endedAt: { type: Date },
    status: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
},
    {
        collection: "processInstanceDetails",
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    });
