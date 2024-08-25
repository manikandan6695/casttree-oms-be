import * as mongoose from "mongoose";
import {
  EInventoryActions,
  ESInventoryActions,
  ESTransactionType,
  ETransactionType,
} from "../enum/inventory-actions.enum";
const Objectid = mongoose.Schema.Types.ObjectId;

export interface IdeliveryDetailInterface {
  bill_id: string;
  inventory_id: string;
  quantity: number;
}

export interface IInventoryModel extends mongoose.Document {
  organization_id: string;
  item_id: string;
  warehouse_id: string;
  inventory_account: string;
  action_type: EInventoryActions;
  transaction_type: ETransactionType;
  document_date: Date;
  source_id: string;
  source_type: string;
  opening_stock: number;
  opening_stock_rate_per_unit?: number;
  transaction_quantity: number;
  closing_balance: number;
  rate: number;
  amount_with_tax: number;
  delivered_quantity?: number;
  delivery_details?: [IdeliveryDetailInterface];
  created_by: string;
  updated_by: string;
}

export const deliveryDetailSchema = new mongoose.Schema<any>({
  bill_id: { type: Objectid },
  inventory_id: { type: Objectid },
  quantity: { type: "Number" },
});

export const inventorySchema = new mongoose.Schema<any>(
  {
    organization_id: { type: Objectid, ref: "organization", required: true },
    item_id: { type: Objectid, ref: "item", required: true },
    warehouse_id: { type: Objectid, ref: "warehouse", required: true },
    inventory_account: { type: Objectid, required: true, ref: "account" },
    action_type: {
      type: "String",
      enum: ESInventoryActions,
      required: true,
      example: "On Inventory Add /On Bill Creation",
    },
    transaction_type: {
      type: "String",
      enum: ESTransactionType,
      required: true,
      example: "In/Out",
    },
    document_date: { type: "Date", required: true },
    source_id: { type: Objectid, required: true },
    source_type: { type: "String", required: true },
    opening_stock: { type: "Number", required: true },
    opening_stock_rate_per_unit: { type: "Number" },
    transaction_quantity: { type: "Number", required: true },
    closing_balance: { type: "Number", required: true },
    rate: { type: "Number", required: true },
    amount_with_tax: { type: "Number", required: true },
    delivered_quantity: { type: "Number" },
    delivery_details: [deliveryDetailSchema],
    created_by: {
      type: Objectid,
      ref: "user",
    },
    updated_by: {
      type: Objectid,
      ref: "user",
    },
  },
  {
    collection: "inventory",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
