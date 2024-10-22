import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import {
  ILanguageModel,
  IskillModel,
  languageSchema,
  skillSchema,
} from "./language.schema";
import { EserviceItemType } from "../enum/serviceItem.type.enum";

export interface serviceitems {
  itemId: string;
  userId: string;
  skill: IskillModel;
  language: ILanguageModel[];
  status: string;
  respondTime: string;
  itemSold: number;
  type:string;

}

export const serviceitemsSchema = new mongoose.Schema<any>({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "item",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  skill: {
    type: skillSchema,
  },
  respondTime: {
    type: String,
  },
  language: [languageSchema],
  status: {
    type: String,
  },
  itemSold: {
    type: Number,
  },
  type:{
    type:String,
    default:EserviceItemType.feedback

  }
  type:{
    type:String,
    default: EserviceItemType.Feedback
  }
});
