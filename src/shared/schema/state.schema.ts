import * as mongoose from "mongoose";
import { ICountryModel } from "./country.schema";

export interface IStateModel extends mongoose.Document {
  country: string | ICountryModel;
  country_id: string;
  state_id: string;
  state_name: string;
}

export const StateSchema = new mongoose.Schema(
  {
    country: { type: mongoose.Schema.Types.ObjectId, ref: "country" },
    country_id: { type: String },
    state_id: { type: String },
    state_name: { type: String },
  },
  {
    collection: "state",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
