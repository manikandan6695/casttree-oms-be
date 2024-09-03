import { Schema,Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { ILanguageModel, languageSchema } from "./language.schema";
export interface serviceitems {
//@Prop({unique : true})
    itemId: string;

    userId: string;

    skill: string;

    language: ILanguageModel[];

    status: string;
}


export const serviceitemsSchema = new mongoose.Schema<any>({
  itemId: {
  
  
        type: mongoose.Schema.Types.ObjectId,
      ref:"item"
  },
  userId: {
        type: mongoose.Schema.Types.ObjectId,
      ref:"user"
  },
  skill: {
    type: String,
  },
  
  language: [languageSchema],
  
  status: {
    type: String,
  },
  
});
