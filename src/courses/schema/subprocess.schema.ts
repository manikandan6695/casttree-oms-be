import mongoose from "mongoose";

export interface subprocessModel {
    tasks: string[];
    isCompleted: boolean;
    chapterMetaData: object;

}
export const subprocessSchema = new mongoose.Schema<any>({

    tasks: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "tasks",
        },
    ],
    isCompleted: { type: Boolean },
    chapterMetaData: { type: Object }
},
    {
        collection: "subprocess",
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }

);


