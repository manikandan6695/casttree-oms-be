import mongoose from "mongoose";

export interface processInstanceModel {
    userId: string;
    processId: string;
    processType: string;
    startedAt: any;
    orderId: string;
    processStatus: string;
    currentTask: string;
    purchasedAt: any;
    validTill: any;
    status: string;
    createdBy: string;
    updatedBy: string;


}
export const processInstanceSchema = new mongoose.Schema<any>({

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    processId: { type: mongoose.Schema.Types.ObjectId, ref: "process" },
    processType: { type: String },
    startedAt: { type: Date },
    orderId: { type: String },
    processStatus: { type: String },
    currentTask: { type: mongoose.Schema.Types.ObjectId, ref: "task" },
    purchasedAt: { type: Date },
    validTill: { type: Date },
    status: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },

}
    ,
    {
        collection: "processInstance",
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    });
