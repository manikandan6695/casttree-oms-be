import mongoose from "mongoose";
export interface videoDescriptionModel {
    title: string;
    body: string;
    mediaUrl: string;


}
export const videoDescriptionSchema = new mongoose.Schema<any>({
    title: {
        type: String,
    },
    body: {
        type: String,
    },
    mediaUrl: {
        type: String,
    },
});