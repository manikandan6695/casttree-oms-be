import * as mongoose from "mongoose";
import { EDocumentTypeName } from "../enum/document-type-name.enum";

export interface ISalesDocumentModel extends mongoose.Document {
  source_id?: string;
  source_type?: string;
  document_id: any;
  document_type_name: EDocumentTypeName;
  doc_id_gen_type: string;
  sales_doc_id_prefix: string;
  sales_doc_id: number;
  sales_document_number: string;
  document_number?: string;
  E_doc_id: string;
  document_status: string;
  item_count: number;
  currency: any;
  curency_code: string;
  sub_total: number;
  due_date: Date | string;
  due_status: string;
  discount_type: string;
  discount_level: string;
  discount: number;
  discount_amount: number;
  adjustments: number;
  grand_total: number;
  balance: number;
  status: string;
  refund: number;
  created_by: any;
  updated_by: any;
}

export const SalesDocumentSchema = new mongoose.Schema(
  {
    source_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    source_type: {
      type: String,
    },
    status: {
      type: String,
    },
    document_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "transactionSeriesDetail",
    },
    document_type_name: {
      type: String,
    },
    doc_id_gen_type: {
      type: String,
    },
    sales_doc_id_prefix: {
      type: String,
    },
    sales_doc_id: {
      type: Number,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branch",
    },
    sales_document_number: {
      type: String,
    },
    document_number: {
      type: String,
    },
    tax_treatment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "taxTreatment",
    },
    E_doc_id: {
      type: String,
    },
    document_status: {
      type: String,
    },
    acknowledgement_status: {
      type: String,
    },
    acknowledgement_reason: {
      type: String,
    },
    acknowledged_date: {
      type: String,
    },
    is_viewed_by_recipient: {
      type: Boolean,
    },
    recipient_viewed_on: {
      type: String,
    },
    is_email_dispatched: {
      type: Boolean,
    },
    price_list_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "priceList",
    },
    reference_number: {
      type: String,
    },
    sales_date: {
      type: Date,
    },
    sales_expiry_date: {
      type: Date,
    },
    sales_expected_ship_date: {
      type: String,
    },
    payment_terms: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "paymentTerms",
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "warehouse",
    },
    sales_person: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
    },
    item_count: {
      type: Number,
    },
    currency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "currency",
    },
    curency_code: {
      type: String,
    },
    sub_total: {
      type: Number,
    },
    added_type: {
      type: String,
    },
    added_type_description: {
      type: String,
    },
    discount_type: {
      type: String,
    },
    discount_level: {
      type: String,
    },
    discount: {
      type: Number,
    },
    discount_amount: {
      type: Number,
    },
    shipping_charge: {
      type: Number,
    },
    due_date: {
      type: Date,
    },
    due_status: {
      type: String,
    },
    adjustments: {
      type: Number,
    },
    grand_total: {
      type: Number,
    },
    balance: {
      type: Number,
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
    collection: "salesDocument",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
