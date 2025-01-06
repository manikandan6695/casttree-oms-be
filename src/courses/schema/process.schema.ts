import mongoose from "mongoose";

export interface processModel {
    chapters: string[];
    chapterMetaData: any;

}
export const processSchema = new mongoose.Schema<any>({
    chapters: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "chapters",
        },
    ],
    chapterMetaDAta: { type: Object }
},
{
    collection: "processes",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
}
);




