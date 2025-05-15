import * as mongoose from "mongoose";
import { ICountryModel } from "src/shared/schema/country.schema";

export interface ITaxSpecificationModel extends mongoose.Document {
  country: string | ICountryModel;
  country_id: string;
  country_code: string;
  tax_specification_name: string;
  applicable_tax_types: any[];
  rule: any;
  description: string;
}

export const TaxSpecificationSchema = new mongoose.Schema(
  {
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "country",
    },
    country_id: {
      type: String,
    },
    country_code: {
      type: String,
    },
    tax_specification_name: {
      type: String,
    },
    applicable_tax_types: [{ type: String }],
    rule: {
      type: String,
    },
    description: { type: String },
  },
  {
    collection: "taxSpecification",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

TaxSpecificationSchema.virtual("tax_types", {
  ref: "taxType",
  localField: "applicable_tax_types",
  foreignField: "tax_id",
  justOne: true,
});

TaxSpecificationSchema.set("toJSON", { virtuals: true });
