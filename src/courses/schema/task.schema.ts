import mongoose from "mongoose";

export interface taskModel {
    title: string;
    processId: string;
    parentProcessId: string;
    taskNumber:number;
    type: string;
    isLocked: boolean;
    isCompleted: boolean;
    taskMetaData: any;
}
export const taskSchema = new mongoose.Schema<any>({
    title: { type: String },
    parentProcessId: { type: mongoose.Schema.Types.ObjectId, ref: "processes" },
    processId: { type: mongoose.Schema.Types.ObjectId, ref: "subprocess" },
    taskNumber: { type: Number },
    type: { type: String },
    isLocked: { type: Boolean },
    isCompleted:{ type: Boolean },
    taskMetaData: {type: Object}

}
,

    {
        collection: "tasks",
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    });