import * as mongoose from "mongoose";
import {
  EPricingScheme,
  ESPricingScheme,
} from "../../interface/enums/pricing-schema.enum";
export interface IPriceListModel extends mongoose.Document {
  organization_id: string;
  price_list_name: string;
  status: string;
  type: string;
  item_rate_type: string;
  currency: any;
  curency_code: string;
  description: string;
  percentage: number;
  pricebook: string;
  pricing_scheme: EPricingScheme;
  rounding_type: string;
  created_by: any;
  updated_by: any;
}
export const PriceListSchema = new mongoose.Schema<any>(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
    },
    price_list_name: {
      type: String,
    },
    currency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "currency",
    },
    curency_code: {
      type: String,
    },
    status: {
      type: String,
      default: "Active",
    },
    type: {
      type: String,
    },
    item_rate_type: {
      type: String,
    },
    description: {
      type: String,
    },
    percentage: {
      type: Number,
    },
    pricebook: {
      type: String,
    },
    pricing_scheme: {
      type: String,
      enum: ESPricingScheme,
    },
    rounding_type: {
      type: String,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    collection: "priceList",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
