import * as mongoose from "mongoose";
import { ICountryModel } from "./country.schema";
import { IStateModel } from "./state.schema";

export interface ICityModel extends mongoose.Document {
  country: string | ICountryModel;
  state: string | IStateModel;
  country_id: string;
  state_id: string;
  city_id: string;
  city_name: string;
}

export const CitySchema = new mongoose.Schema(
  {
    country: { type: mongoose.Schema.Types.ObjectId, ref: "country" },
    state: { type: mongoose.Schema.Types.ObjectId, ref: "state" },
    country_id: { type: String },
    state_id: { type: String },
    city_id: { type: String },
    city_name: { type: String },
  },
  {
    collection: "city",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
