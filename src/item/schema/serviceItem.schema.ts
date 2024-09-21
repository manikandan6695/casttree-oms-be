import { Schema,Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { ILanguageModel, IskillModel, languageSchema, skillSchema } from "./language.schema";
export interface serviceitems {
//@Prop({unique : true})
    itemId: string;

    userId: string;

    skill: IskillModel;

    language: ILanguageModel[];

    status: string;
    
    itemSold:number;
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
    type: skillSchema,
  },
  
  language: [languageSchema],
  
  status: {
    type: String,
  },

  itemSold: {
    type: Number,
  },
  
});
