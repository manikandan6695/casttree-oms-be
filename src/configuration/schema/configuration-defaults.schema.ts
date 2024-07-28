import * as mongoose from "mongoose";
import { ICountryModel } from "src/shared/schema/country.schema";

export interface IConfigurationDefaultModel extends mongoose.Document {
  is_country_specified: boolean;
  country: string | ICountryModel;
  configurations?: any;
  status?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: Date;
  updated_at?: Date;
}

export const ConfigurationDefaultSchema = new mongoose.Schema(
  {
    is_country_specified: { type: Boolean },
    country: { type: mongoose.Schema.Types.ObjectId, ref: "country" },
    configurations: {
      type: mongoose.Schema.Types.Mixed,
    },
    status: { type: String },
    created_by: { type: String },
    updated_by: { type: String },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
    },
  },
  {
    collection: "configurationDefaults",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
