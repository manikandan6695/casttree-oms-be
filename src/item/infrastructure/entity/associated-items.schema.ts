import * as mongoose from "mongoose";
import { ESstatus, Estatus } from "../../interface/enums/status.enum";

export interface IAssociatedItemsModel extends mongoose.Document {
  organization_id: string;
  parent_item_id: any;
  item_id?: any;
  quantity?: number;
  created_by: string;
  updated_by: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export const AssociatedItemsSchema = new mongoose.Schema<any>(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
    },
    parent_item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "item",
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "item",
    },
    quantity: { type: Number },
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
    collection: "associatedItems",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
