import * as mongoose from "mongoose";

export interface ICurrencyModel extends mongoose.Document {
  currency_name: string;
  currency_name_plural: string;
  currency_code: string;
  currency_symbol: string;
  currency_symbol_native: string;
  decimal_digits: number;
  base_conversion_factor: number;
  rounding: number;
  is_default: boolean;
  media: any;
}

export const CurrencySchema = new mongoose.Schema(
  {
    currency_name: { type: String },
    currency_name_plural: { type: String },
    currency_code: { type: String },
    currency_symbol: { type: String },
    currency_symbol_native: { type: String },
    decimal_digits: { type: Number },
    base_conversion_factor: { type: Number },
    rounding: { type: Number },
    is_default: { type: Boolean },
    media: { type: mongoose.Schema.Types.Mixed },
  },
  {
    collection: "currency",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);