import mongoose from "mongoose";

export interface taskModel {
    title: string;
    processId: string;
    parentProcessId: string;
    taskNumber: number;
    type: string;
    isLocked: boolean;
    taskMetaData: any;
    status: string;
}
export const taskSchema = new mongoose.Schema<any>({
    title: { type: String },
    parentProcessId: { type: mongoose.Schema.Types.ObjectId, ref: "process" },
    processId: { type: mongoose.Schema.Types.ObjectId, ref: "process" },
    taskNumber: { type: Number },
    type: { type: String },
    isLocked: { type: Boolean },
    taskMetaData: { type: Object },
    status: { type: String },

}
    ,

    {
        collection: "task",
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    });