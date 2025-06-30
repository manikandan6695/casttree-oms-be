import mongoose from "mongoose";
import {
  ILanguageModel,
  IskillModel,
  languageSchema,
  skillSchema,
} from "./language.schema";
import { EStatus } from "src/shared/enum/privacy.enum";
import { MediaSchema } from "./platform-item.schema";


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

export interface serviceItemAdditionalDetailModel {

  processId: string;
  thumbnail: string;
  ctaName: string;
  navigationURL: string;
}
export const serviceItemAdditionalDetailSchema = new mongoose.Schema<any>({

  processId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "processes",
  },
  thumbnail: {
    type: String
  },
  ctaName: {
    type: String
  },
  navigationURL: {
    type: String
  },


})

export interface tagModel {
  category_id: string;
  name: string;
}
export const tagSchema = new mongoose.Schema<any>({
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
  type: string;
  expertise: expertiseModel;
  tag: tagModel;
  additionalDetails: serviceItemAdditionalDetailModel;
  priorityOrder:number

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
  type: {
    type: String,


  },
  expertise: [expertiseSchema],
  tag: [tagSchema],
  additionalDetails: serviceItemAdditionalDetailSchema,
  priorityOrder: {
    type: Number,
},

});
