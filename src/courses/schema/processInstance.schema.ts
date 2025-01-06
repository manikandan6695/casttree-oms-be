import mongoose from "mongoose";

export interface processInstanceModel {
    userId: string;
    processId:string;
    processType:string;
    startedAt:any;
    orderId:string;
    processStatus:string;
    currentSubProcess:string;
    currentTask:string;
    purchasedAt:any;
    validTill:any;
    status:string;
    createdBy:string;
    updatedBy:string;

    
}
export const processInstanceSchema = new mongoose.Schema<any>({

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    processId:{ type: mongoose.Schema.Types.ObjectId, ref: "processes" },
    processType:{type:String},
    startedAt:{type:Date},
    orderId:{ type: String},
    processStatus:{type:String},
    currentSubProcess:{ type: mongoose.Schema.Types.ObjectId, ref: "subprocess" },
    currentTask:{ type: mongoose.Schema.Types.ObjectId, ref: "tasks" },
    purchasedAt:{type:Date},
    validTill:{type:Date},
    status:{type:String},
    createdBy:{ type: mongoose.Schema.Types.ObjectId, ref: "user" },
    updatedBy:{ type: mongoose.Schema.Types.ObjectId, ref: "user" },

}
,
{
    collection: "processInstances",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  });
