import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
export interface Ratingsv1 {

  sourceId: string;

  sourceType: string;

  overAllRating: number;

  scale: number;

  overAllDescription: string;

  status: string;

  reviewedBy: string;

  createdAt: any;

  updatedAt: any;

  createdBy: string;

  updatedBy: string;
}
export interface Ratingsaggregated {
  
  sourceId: string;

  sourceType: string;

  averageOverallRating: Number;

  scale: Number;

  totalReviewNumber: Number;
}
export const ratingSchema = new mongoose.Schema<any>({
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "serviceitems",
  },
  sourceType: {
    type: String,
  },
  overAllRating: {
    type: Number,
  },
  scale: {
    type: Number,
  },
  overAllDescription: {
    type: String,
  },
  status: {
    type: String,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },

  createdBy: {
    type: String,
  },
  updatedBy: {
    type: String,
  }
}
  ,
  {
    collection: "Ratingsv1",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  });
export const ratingaggregatedSchema = new mongoose.Schema<any>({
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  sourceType: {
    type: String,
  },

  scale: {
    type: Number,
  },
  averageOverallRating: {
    type: Number,
  },

  totalReviewNumber: {
    type: Number,
  },


});