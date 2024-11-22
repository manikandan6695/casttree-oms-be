import { string } from "joi";
import * as mongoose from "mongoose";
import { EItemClassification } from "../enum/item-classification.enum";
import { EItemType } from "../enum/item-type.enum";
import { EItemSubType } from "../enum/item_sub_type.enum";
import { ETaxPreference } from "../enum/tax-preference.enum";
import { IManufacturer } from "./manufacturer.schema";
import {
  additionalDetailSchema,
  IAdditionalDetailModel,
  IItemCommissionMarkupCurrencyModel,
  ItemCommissionMarkupCurrencySchema,
} from "./platform-item.schema";
import { itemAdditionalDetailModel, itemAdditionalDetailSchema } from "./itemAdditionalDetail.schema";

export interface IItemModel extends mongoose.Document {
  orgId: any; //or org model
  item_type: EItemType;
  item_name: string;
  item_sku?: string;
  item_long_description?: string;
  item_short_description?: string;
  item_sub_type: EItemSubType;
  parent_item_id?: string | IItemModel;
  show_in_list?: boolean;
  media: any;
  item_classification_type: EItemClassification;
  item_base_unit_of_measurement: string;
  uom_id: string;
  is_sales_configure: boolean;
  item_categories?: string[]; // or category model
  itemCategory?: string; // or category model
  itemSubCategory?: string;
  additionalDetail: itemAdditionalDetailModel;
  itemCommissionMarkupType: string;
  itemCommissionMarkup: number;
  itemCommissionMarkupCurrency: IItemCommissionMarkupCurrencyModel;
  isItemCommissionIncluded: boolean;
  geo: any;
  item_codes?: any;
  item_returnable?: boolean;
  reorder_point?: Number;
  stock_alert?: Number;
  upc?: string;
  ean?: string;
  mpn?: string;
  isbn?: string;
  itemStatusHistory: any;
  item_tax_preference: ETaxPreference;
  excemption_reason?: string | any;
  track_inventory?: boolean;
  item_inventory_account?: any;
  item_sales_info: any;
  item_purchase_info: any;
  item_manufacturer?: string | IManufacturer;
  item_brand?: string;
  seo_url?: string;
  seo_title?: string;
  seo_description?: string;
  tags?: any[];
  item_sales_channel?: ISalesChannel[];
  item_dimensions?: any;
  item_weight?: any;
  item_taxes?: IItemTax[];
  preffered_vendors?: string | any;
  characteristics: IItemCharacteristics[];
  stock_details: IStockDetails[];
  variant?: ItemVariant;
  created_by: string;
  updated_by: string;
  E_material_code?: string;
  status?: any;
  data_create_mode: string;
  comparePrice: number;
}

export interface IStockDetails {
  warehouse_id: string;
  to_be_shipped?: number;
  to_be_received?: number;
  to_be_billed?: number;
  to_be_invoiced?: number;
  to_be_packed?: number;
}

export interface ISalesChannel {
  channel_id: any;
  from?: Date | string;
  to?: Date | string;
  is_unbounded?: boolean;
  is_seasonal?: boolean;
}
export interface IItemTax {
  item_tax_id: any;
  item_tax_specification: string;
}

export interface IVariantItemDetail {
  variant_key: string;
  variant_combination: [IItemCharacteristics];
  item_id: string | IItemModel;
}
export interface ItemVariant {
  attributes: IItemCharacteristics[];
  item_detail: IVariantItemDetail[];
}
export interface IItemCharacteristics {
  variant_id: string;
  variant_name: string;
  variant_code: string;
  values: string[];
}

export const OpeningStock = new mongoose.Schema<any>({
  warehouse_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "warehouse",
  },
  opening_stock: { type: "Number" },
  opening_stock_value: { type: "Number" },
  stock_alert: { type: "Number" },
});

export const StockDetailsSchema = new mongoose.Schema<any>({
  warehouse_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "warehouse",
  },
  to_be_billed: { type: "Number" },
  to_be_received: { type: "Number" },
  to_be_invoiced: { type: "Number" },
  to_be_packed: { type: "Number" },
  to_be_shipped: { type: "Number" },
});
export const ItemTaxSchema = new mongoose.Schema<any>({
  item_tax_specification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "taxSpecification",
  },
  item_tax_id: { type: mongoose.Schema.Types.Mixed },
});

export const ItemCodeSchema = new mongoose.Schema<any>({
  code: { type: String },
  value: { type: String },
});

export const ItemSalesInfoSchema = new mongoose.Schema<any>({
  selling_price: { type: Number },
  compare_price: { type: Number },
  sales_account: { type: mongoose.Schema.Types.ObjectId, ref: "account" },
  unit: { type: String },
  currency: { type: String },
  description: { type: String },
});
export const ItemPurchaseInfoSchema = new mongoose.Schema<any>({
  cost_price: { type: Number },
  purchase_account: { type: mongoose.Schema.Types.ObjectId, ref: "account" },
  unit: { type: String },
  currency: { type: String },
  description: { type: String },
});
export const ItemMeasurementSchema = new mongoose.Schema<any>({
  type: { type: String },
  value: { type: Number },
  unit: { type: String },
});
export const ItemWeightSchema = new mongoose.Schema<any>({
  value: { type: Number },
  unit: { type: String },
});
export const ItemCharacteristicsSchema = new mongoose.Schema<any>({
  variant_id: { type: mongoose.Schema.Types.ObjectId, ref: "variant" },
  variant_name: { type: String },
  variant_code: { type: String },
  values: [{ type: String }],
});
export const VariantItemDetail = new mongoose.Schema<any>({
  variant_key: { type: String },
  variant_combination: [ItemCharacteristicsSchema],
  item_id: { type: mongoose.Schema.Types.ObjectId, ref: "item" },
});
export const VariantSchema = new mongoose.Schema<any>({
  attributes: [ItemCharacteristicsSchema],
  item_detail: [VariantItemDetail],
});

export const SalesChanelSchema = new mongoose.Schema<any>({
  channel_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "salesChannel",
  },
  from: { type: Date },
  to: { type: Date },
  is_unbounded: { type: Boolean },
  is_seasonal: { type: Boolean },
});

export const MediaSchema = new mongoose.Schema({
  type: {
    type: String,
    description: "Types of the media",
  },
  visibility: {
    type: String,
    description: "Privacy settings of email",
    default: "Public",
  }, //public, private, mutual
  media_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "media",
  },
});

export const ItemSchema = new mongoose.Schema<any>(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
    },
    platformItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "platformItem",
    },
    item_type: { type: String },
    itemName: { type: String },
    item_sku: { type: String },
    show_in_list: { type: Boolean, default: true },
    itemDescription: { type: String },
    geo: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],
    item_short_description: { type: String },
    item_sub_type: { type: String },
    parent_item_id: { type: mongoose.Schema.Types.ObjectId, ref: "item" },
    item_classification_type: { type: String },
    is_sales_configure: { type: Boolean },
    media: [MediaSchema],
    item_base_unit_of_measurement: {
      type: String,
    },
    uom_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "unit",
    },
    item_categories: [
      { type: mongoose.Schema.Types.ObjectId, ref: "category" },
    ],
    itemCategory: { type: mongoose.Schema.Types.ObjectId, ref: "category" },
    itemSubCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },
    itemGroupId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    additionalDetail: itemAdditionalDetailSchema,
    itemCommissionMarkupType: {
      type: String,
    },
    itemCommissionMarkup: {
      type: Number,
    },
    itemCommissionMarkupCurrency: ItemCommissionMarkupCurrencySchema,
    isItemCommissionIncluded: {
      type: Boolean,
    },
    itemStatusHistory: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],
    item_codes: [ItemCodeSchema],
    item_returnable: { type: Boolean },
    reorder_point: { type: Number },
    stock_alert: { type: Number },
    upc: { type: String, minlength: 12, maxlength: 12 },
    ean: { type: String, minlength: 13, maxlength: 13 },
    mpn: { type: String },
    isbn: { type: String, minlength: 13, maxlength: 13 },
    item_tax_preference: { type: String },
    excemption_reason: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "taxExemptions",
    },
    track_inventory: { type: Boolean },
    item_inventory_account: {
      type: mongoose.Schema.Types.Mixed,
    },
    item_sales_info: ItemSalesInfoSchema,
    item_purchase_info: ItemPurchaseInfoSchema,
    item_manufacturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "manufacturer",
    },
    item_brand: { type: mongoose.Schema.Types.ObjectId, ref: "brand" },
    seo_url: { type: String },
    seo_title: { type: String },
    seo_description: { type: String },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "tags" }],
    item_sales_channel: [SalesChanelSchema],
    item_dimensions: [ItemMeasurementSchema],
    item_weight: ItemWeightSchema,
    item_taxes: [ItemTaxSchema],
    preffered_vendors: { type: mongoose.Schema.Types.ObjectId, ref: "vendor" },
    data_create_mode: { type: String },
    characteristics: [ItemCharacteristicsSchema],
    variant: VariantSchema,
    stock_details: [StockDetailsSchema],
    status: { type: String, default: "Active" },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    E_material_code: { type: String },
    comparePrice: { type: Number },
  },
  {
    collection: "item",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// ItemSchema.index(
//   { organization_id: 1, item_sku: 1 },
//   { name: "Item SKU", unique: true }
// );
