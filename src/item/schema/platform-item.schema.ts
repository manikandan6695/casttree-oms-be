import * as mongoose from "mongoose";
import { EworkshopMode } from "../enum/workshopMode.enum";
export interface IMedia {
  type?: string;
  media_id?: any;
  visibility?: string;
}

export interface IItemNoteModel {
  title: string;
  icon: string;
  description: string;
}
export interface IAdditionalDetailModel {
  reponseMode: string;
  maxFollowup: number;
  maxCustomQuestions: number;
  itemNote: IItemNoteModel;
  meetingLink: string;
  registrationExpiry: Date;
  defaultImage: IMedia[];
  workShopStartDate:  Date;
  mode: string;
  workShopEndDate:  Date;
  startTime:Date;
  endTime:Date;

}

export interface IItemCommissionMarkupCurrencyModel {
  reponseMode: string;
  maxFollowup: number;
  maxCustomQuestions: number;
}
export interface IPlatformItemModel extends mongoose.Document {
  itemName: string;
  itemDescription: string;
  itemCategory: string;
  itemSubCategory: string;
  itemGroupId: string;
  media: IMedia[];
  additionalDetail: IAdditionalDetailModel;
  itemCommissionMarkupType: string;
  itemCommissionMarkup: number;
  itemCommissionMarkupCurrency: IItemCommissionMarkupCurrencyModel;
  isItemCommissionIncluded: boolean;
  status: string;
  created_by: string;
  updated_by: string;
}
export const itemNoteSchema = new mongoose.Schema<any>({
  title: {
    type: String,
  },
  icon: {
    type: String,
  },
  description: {
    type: String,
  },
});
export const MediaSchema = new mongoose.Schema({
  type: {
    type: String,
    description: "Types of the media",
  },
  visibility: {
    type: String,
    description: "Privacy settings of email",
    default: "Public",
  }, //public, private, mutual
  media_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "media",
  },
});
export const additionalDetailSchema = new mongoose.Schema<any>({
  reponseMode: {
    type: String,
  },
  maxFollowup: {
    type: Number,
  },
  maxCustomQuestions: {
    type: Number,
  },
  itemNote: itemNoteSchema,
  meetingLink: { type: String },
  registrationExpiry: { type: Date },
  defaultImage: [MediaSchema],
  workShopStartDate: { type: Date },
  mode: {
    type: String
  },
  workShopEndDate: { type: Date },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  }


});


export const ItemCommissionMarkupCurrencySchema = new mongoose.Schema<any>({
  currency_id: { type: String },
  currency_name: { type: String },
  currency_code: { type: String },
  currency_symbol: { type: String },
});
export const platformItemSchema = new mongoose.Schema<any>(
  {
    itemName: {
      type: String,
    },
    itemDescription: {
      type: String,
    },
    itemCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },
    itemSubCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },
    itemGroupId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    media: [MediaSchema],
    additionalDetail: additionalDetailSchema,
    itemCommissionMarkupType: {
      type: String,
    },
    itemCommissionMarkup: {
      type: Number,
    },
    itemCommissionMarkupCurrency: ItemCommissionMarkupCurrencySchema,
    isItemCommissionIncluded: {
      type: Boolean,
    },
    status: {
      type: String,
    },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  {
    collection: "platformItem",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
