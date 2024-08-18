import * as mongoose from "mongoose";

export interface IPaymentModel extends mongoose.Document {
  user_id: any;
  source_id: any;
  source_type: any;
  document_status: string;
  transaction_type: string;
  payment_date: Date;
  tendered_amount: number;
  payment_order_id: string;
  document_id: any;
  document_type_name: any;
  doc_id_gen_type: string;
  payment_doc_id_prefix: string;
  payment_doc_id: number;
  payment_document_number: string;
  document_number: string;
  place_of_supply: any;
  source_of_supply: any;
  description_of_supply: string;
  amount: number;
  total_tax_amount: number;
  branch: any;
  unused_amount: number;
  type: any;
  bank_charges: number;
  is_tds_deducted: boolean;
  is_reverese_charge_applied: boolean;
  tds_tax_account: any;
  tax: any;
  status: string;
  internal_notes: string;
  reference_number: string;
  payment_mode: any;
  account: any;
  currency_code: string;
  currency: any;
  created_by: any;
  updated_by: any;
}
export const PaymentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    payment_order_id: {
      type: String,
    },
    payment_date: {
      type: Date,
    },
    doc_id_gen_type: {
      type: String,
    },
    payment_doc_id_prefix: {
      type: String,
    },
    document_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "transactionSeriesDetail",
    },
    document_type_name: {
      type: String,
    },
    document_status: {
      type: String,
    },
    type: {
      type: String,
      example: "Customer Advance,Invoice Payment",
    },
    payment_doc_id: {
      type: Number,
    },
    payment_document_number: {
      type: String,
    },
    document_number: {
      type: String,
    },
    source_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    source_type: {
      type: String,
    },
    place_of_supply: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "state",
    },
    source_of_supply: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "state",
    },
    tax: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tax",
    },
    description_of_supply: {
      type: String,
    },
    amount: {
      type: Number,
    },
    total_tax_amount: {
      type: Number,
    },
    unused_amount: {
      type: Number,
    },
    bank_charges: {
      type: Number,
    },
    is_tds_deducted: {
      type: Boolean,
    },
    is_reverese_charge_applied: {
      type: Boolean,
    },
    tds_tax_account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
    },
    internal_notes: {
      type: String,
    },
    transaction_type: {
      type: String,
    },
    currency_code: {
      type: String,
    },
    tendered_amount: {
      type: Number,
    },
    reference_number: {
      type: String,
    },
    payment_mode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "paymentMode",
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branch",
    },
    currency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "currency",
    },
    status: {
      type: String,
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
    collection: "payment",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
