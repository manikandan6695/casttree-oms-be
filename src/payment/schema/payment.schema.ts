import * as mongoose from "mongoose";
import {
  EPaymentStatus,
  ESPaymentSourceType,
  ESSourceType,
} from "../enum/payment.enum";

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
  reason: any;
  providerId: number;
  providerName: string;
  type: any;
  paymentType: string;
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
  currencyCode: string;
  currency: any;
  baseCurrency: string;
  baseAmount: number;
  conversionRate: number;
  transactionDate: Date;
  metaData: any;
  created_by: any;
  updated_by: any;
  isPaymentRefunded: boolean;
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
      default: EPaymentStatus.pending,
    },
    payment_doc_id: {
      type: Number,
    },
    payment_document_number: {
      type: String,
    },
    providerId: {
      type: Number,
    },
    providerName: {
      type: String,
    },
    type: {
      type: String,
    },
    document_number: {
      type: String,
    },
    reason: { type: mongoose.Schema.Types.Mixed },
    source_id: { type: mongoose.Schema.Types.ObjectId, refPath: "source_type" },
    source_type: { type: String, enum: ESPaymentSourceType },
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
    paymentType: {
      type: String,
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
    currencyCode: {
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
    baseCurrency: {
      type: String,
    },
    baseAmount: {
      type: Number,
    },
    conversionRate: {
      type: Number,
    },
    status: {
      type: String,
    },
    transactionDate: {
      type: Date,
    },
    metaData: {
      type: mongoose.Schema.Types.Mixed,
    },
    isPaymentRefunded:{
      type: Boolean
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
