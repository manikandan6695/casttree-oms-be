import { Schema,Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { ILanguageModel, languageSchema } from "src/profile/schema/profile.schema";
export interface serviceItem {
//@Prop({unique : true})

    userId: string;

    skill: string;

    language: ILanguageModel[];

    status: string;
}


export const serviceItemSchema = new mongoose.Schema<any>({
  userId: {
    type: String,
  },
  skill: {
    type: String,
  },
  
  language: [languageSchema],
  
  status: {
    type: String,
  },
  
});