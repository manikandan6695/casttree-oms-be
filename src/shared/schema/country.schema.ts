import * as mongoose from "mongoose";

export interface ICountryModel extends mongoose.Document {
  country_id: string;
  country_code: string;
  country_name: string;
  phonecode: string;
  is_default: boolean;
}

export const CountrySchema = new mongoose.Schema(
  {
    country_id: { type: String },
    country_code: { type: String },
    country_name: { type: String },
    phonecode: { type: String },
    is_default: { type: Boolean },
  },
  {
    collection: "country",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
