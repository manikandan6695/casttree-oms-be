import * as mongoose from "mongoose";
import {
  EDocumentTypeName,
  ESDocumentTypeName,
} from "../enum/document-type-name.enum";

export interface IItemTax {
  tax_id: any;
  tax_name: string;
  tax_percentage: number;
  tax_value: number;
}

export interface IItemTaxComposition {
  tax_id: any;
  tax_name: string;
  tax_percentage: number;
  tax_value: number;
}
export interface IItemCodesModel {
  code: string;
  value: string;
}
export enum EItemSourceType {
  associated_items = "associatedItems",
  item = "item",
  plan = "plan",
  addon = "addon",
  associatedItems = "associatedItems",
}
export const ESItemSourceType = [
  EItemSourceType.associated_items,
  EItemSourceType.item,
  EItemSourceType.plan,
  EItemSourceType.addon,
  EItemSourceType.associatedItems,
];
export interface IItemCompositionModel extends mongoose.Document {
  reference_item_id: string;
  organization_id: any;
  source_id: string;
  source_type: string;
  transaction_type: string;
  item_id: any;
  item_source_type: EItemSourceType;
  item_name: string;
  item_description: string;
  item_codes: IItemCodesModel[];
  quantity: number;
  unit: string;
  rate: number;
  item_tax: IItemTax;
  item_tax_excemtion: IItemTax;
  item_tax_composition: IItemTaxComposition[];
  amount: number;
  amount_with_tax: number;
}
export interface IItemDocumentModel extends mongoose.Document {
  reference_item_id: string;
  organization_id: any;
  source_id: string;
  source_type: any;
  document_type: EDocumentTypeName;
  transaction_type: string;
  item_id: any;
  item_source_type: string | EItemSourceType;
  item_name: string;
  price_list_id: any;
  sale_order_item_id: any;
  item_description: string;
  item_codes: IItemCodesModel[];
  quantity: number;
  unit: string;
  rate: number;
  item_tax: IItemTax;
  item_tax_excemption: IItemTax;
  item_tax_composition: IItemTaxComposition[];
  m_item_composition: [IItemCompositionModel];
  t_item_composition: [IItemCompositionModel];
  amount: number;
  amount_with_tax: number;
  created_by: any;
  updated_by: any;
}
export const ItemCodesSchema = new mongoose.Schema({
  code: {
    type: String,
  },
  value: {
    type: String,
  },
});
export const ItemTaxComposition = new mongoose.Schema({
  tax_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "tax",
  },
  tax_name: {
    type: String,
  },
  tax_percentage: {
    type: Number,
  },
  tax_value: {
    type: Number,
  },
});
export const ItemTax = new mongoose.Schema({
  tax_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "tax",
  },
  tax_name: {
    type: String,
  },
  tax_percentage: {
    type: Number,
  },
  tax_value: {
    type: Number,
  },
});
export const ItemCompositionSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "organization",
  },
  source_id: {
    type: mongoose.Schema.Types.ObjectId,
  },
  source_type: {
    type: String,
  },
  sale_order_item_id: {
    type: mongoose.Schema.Types.ObjectId,
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "account",
  },
  inventory_account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "account",
  },
  transaction_type: {
    type: String,
  },
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "item_source_type",
  },
  item_source_type: {
    type: String,
    enum: ESItemSourceType,
  },
  item_name: {
    type: String,
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "branch",
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "warehouse",
  },
  item_description: {
    type: String,
  },
  item_codes: [ItemCodesSchema],
  quantity: {
    type: Number,
  },
  unit: {
    type: String,
  },
  unit_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "unit",
  },
  rate: {
    type: Number,
  },
  item_tax: ItemTax,
  item_tax_excemption: ItemTax,
  item_tax_composition: [ItemTaxComposition],
  amount: {
    type: Number,
  },
  amount_with_tax: {
    type: Number,
  },
  reference_item_id: {
    type: mongoose.Schema.Types.ObjectId,
  },
});
export const ItemDocumentSchema = new mongoose.Schema(
  {
    source_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    source_type: {
      type: String,
    },
    document_type: {
      type: String,
      enum: ESDocumentTypeName,
    },

    transaction_type: {
      type: String,
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "item_source_type",
    },
    price_list_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "priceList",
    },
    item_source_type: {
      type: String,
      enum: ESItemSourceType,
    },
    item_name: {
      type: String,
    },
    item_description: {
      type: String,
    },
    item_codes: [ItemCodesSchema],
    quantity: {
      type: Number,
    },
    unit: {
      type: String,
    },
    unit_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "unit",
    },
    rate: {
      type: Number,
    },
    item_tax: ItemTax,
    item_tax_excemption: ItemTax,
    item_tax_composition: [ItemTaxComposition],
    amount: {
      type: Number,
    },
    m_item_composition: [ItemCompositionSchema],
    t_item_composition: [ItemCompositionSchema],
    amount_with_tax: {
      type: Number,
    },
    reference_item_id: {
      type: mongoose.Schema.Types.ObjectId,
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
    collection: "itemDocument",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
