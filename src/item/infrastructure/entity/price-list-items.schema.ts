import * as mongoose from "mongoose";
// import { ICurrencyModel } from "src/shared/schema/currency.schema";

// export class PriceBrackets {
//   starting_quantity?: number;
//   ending_quantity?: number;
//   price: number;
//   currency: string | ICurrencyModel;
// }
export interface IPriceListItemsModel extends mongoose.Document {
  organization_id?: string;
  price_list_id?: string;
  item_id: string;
  pricing_scheme: string;
  price: number;
  comparePrice: number;
  // pricing_brackets: PriceBrackets[];
  country_code: string;
  currency: string | any; // ICurrencyModel type can be updated if needed
  created_by?: any;
  updated_by?: any;
}
export const PriceListItemsSchema = new mongoose.Schema<any>(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
    },
    price_list_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "priceList",
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "item",
    },
    pricing_scheme: {
      type: String,
    },
    currency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "currency",
    },
    // pricing_brackets: [{ type: mongoose.Schema.Types.Mixed }],
    price: {
      type: Number,
    },
    comparePrice: {
      type: Number,
    },
    country_code: {
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
    collection: "priceListItems",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
