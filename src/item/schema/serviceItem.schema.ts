import { Schema,Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { ILanguageModel, languageSchema } from "./language.schema";
export interface serviceItem {
//@Prop({unique : true})
    itemId: string;

    userId: string;

    skill: string;

    language: ILanguageModel[];

    status: string;
}


export const serviceItemSchema = new mongoose.Schema<any>({
  itemId: {
    type: String,
  },
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
