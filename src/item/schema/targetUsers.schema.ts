import mongoose from "mongoose";
export interface targetUsersModel {
    icon: string;
    title: string;
    body: string;

}
export const targetUsersSchema = new mongoose.Schema<any>({
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