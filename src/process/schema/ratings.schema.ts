import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { EratingStatus,EsourceType,EtransactionType } from "../enums/ratings.enum";
export interface RatingSchema {
  sourceId: string;

  transactionId: string;

  transactionType: string;

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
export interface ratingsAggregated {
  sourceId: string;

  sourceType: string;

  finalAverageRating: number;

  averageOverallRating: number;

  scale: number;

  totalReviewNumber: number;
}
export const ratingSchema = new mongoose.Schema<any>(
  {
    sourceId: {
      type: String,
    },

    sourceType: {
      type: String,
      default: EsourceType.item,
    },
    transactionId: {
      type: String,
    },

    transactionType: {
      type: String,
      default: EtransactionType.serviceRequest,
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
      default: EratingStatus.active,
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
    },
  },
  {
    collection: "ratings",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
export const ratingAggregatedSchema = new mongoose.Schema<any>({
  sourceId: {
    type: String,
  },

  sourceType: {
    type: String,
    default: EsourceType.item,
  },

  scale: {
    type: Number,
  },

  finalAverageRating: {
    type: Number,
  },
  averageOverallRating: {
    type: Number,
  },

  totalReviewNumber: {
    type: Number,
  },
});
