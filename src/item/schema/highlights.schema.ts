import mongoose from "mongoose";
export interface highlightsModel {
    icon: string;
    title: string;
    body: string;

}
export const highlightsSchema = new mongoose.Schema<any>({
    icon: {
        type: String,
    },
    title: {
        type: String,
    },
    body: {
        type: String,
    }

});