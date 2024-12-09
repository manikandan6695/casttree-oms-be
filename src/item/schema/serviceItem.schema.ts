import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import {
  ILanguageModel,
  IskillModel,
  languageSchema,
  skillSchema,
} from "./language.schema";
import { EserviceItemType } from "../enum/serviceItem.type.enum";


export interface expertiseModel {
  category_id: string;
  name: string;
}
export const expertiseSchema = new mongoose.Schema<any>({
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
  },
 
  name: {
    type: String,
  },
})


export interface serviceitems {
  itemId: string;
  userId: string;
  skill: IskillModel;
  language: ILanguageModel[];
  status: string;
  respondTime: string;
  itemSold: number;
  type:string;
  expertise: expertiseModel;

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


  },
  expertise: [ expertiseSchema],

});
