import * as mongoose from "mongoose";
import { ICountryModel } from "src/shared/schema/country.schema";

export interface ITaxTypeModel extends mongoose.Document {
  tax_id: string;
  tax_name: string;
  input_account_key: string;
  output_account_key: string;
  country: string | ICountryModel;
  country_code: string;
}
export const TaxTypeSchema = new mongoose.Schema(
  {
    tax_id: {
      type: String,
    },
    tax_name: {
      type: String,
    },
    input_account_key: {
      type: String,
    },
    output_account_key: {
      type: String,
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "country",
    },
    country_code: {
      type: String,
    },
  },
  {
    collection: "taxType",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
