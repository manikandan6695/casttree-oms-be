import mongoose from "mongoose";
export interface faqModel {
    question: string;
    answer: string;


}
export const faqSchema = new mongoose.Schema<any>({
    question: {
        type: String,
    },
    answer: {
        type: String,
    },
});