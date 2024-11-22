import mongoose from "mongoose";
export interface testimonialModel {
    image: string;
    name: string;
    body: string;

}
export const testimonialSchema = new mongoose.Schema<any>({
    image: {
        type: String,
    },
    name: {
        type: String,
    },
    body: {
        type: String,
    }

});