import * as mongoose from "mongoose";

import { EDocumentTypeName } from "../enum/document-type-name.enum";
import { ESInoviceType } from "../enum/transaction-type.enum";

export interface IShippingChargeTax {
  tax_id: any;
  tax_name: string;
  tax_percentage: number;
  tax_value: number;
}

export interface ITaxCompositionModel {
  tax_id: any;
  tax_name: string;
  tax_percentage: number;
  tax_value: number;
}
export interface IShippingChargeTaxComposition {
  tax_id: any;
  tax_name: string;
  tax_percentage: number;
  tax_value: number;
}
export interface IShipmentModel {
  shipment_id: any;
  shipment_status: string;
}
export interface IPackagesModel {
  package_id: any;
  package_number: string;
  packages_status: string;
}
export interface IPaymentModel {
  payment_id: any;
  payment_status: string;
}
export interface IInvoicesModel {
  invoice_id: any;
  invoice_number: string;
  invoice_status: string;
}

export interface IInquiryModel {
  inquiry_id: any;
  inquiry_number: string;
  inquiry_status: string;
}

export interface IQuotationModel {
  quotation_id: any;
  quotation_number: string;
  quotation_status: string;
}
export interface ISalesDocumentModel extends mongoose.Document {
  source_id?: string;
  source_type?: string;
  document_id: any;
  invoice_type: string;
  document_type_name: EDocumentTypeName;
  customer_id: any;
  customer_user_id?: string;
  invoice_number: any;
  place_of_supply: any;
  doc_id_gen_type: string;
  sales_doc_id_prefix: string;
  is_deal_created: boolean;
  sales_doc_id: number;
  price_list_id: any;
  sales_document_number: string;
  document_number?: string;
  E_doc_id: string;
  document_status: string;
  branch: any;
  acknowledgement_status: string;
  acknowledgement_reason: string;
  acknowledged_date: string;
  is_viewed_by_recipient: boolean;
  recipient_viewed_on: string;
  is_email_dispatched: boolean;
  reference_number: string;
  sales_date: string | Date;
  tax_treatment: any;
  sales_expiry_date: Date | string;
  sales_expected_ship_date: string;
  payment_terms: any;
  warehouse: any;
  sales_person: any;
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
  shipping_charge: number;
  shipping_charge_tax_type: IShippingChargeTax;
  shipping_charge_tax_composition: IShippingChargeTaxComposition[];
  tax_composition: ITaxCompositionModel[];
  adjustments: number;
  grand_total: number;
  balance: number;
  status: string;
  refund: number;
  ledger_grand_total: number;
  customer_notes: string;
  added_type: string;
  added_type_description: string;
  media: any;
  invoices: IInvoicesModel[];
  inquiry: IInquiryModel;
  quotation: IQuotationModel;
  payments: IPaymentModel[];
  packages: IPackagesModel[];
  shipments: IShipmentModel[];
  created_by: any;
  updated_by: any;
}

export const ShipmentsSchema = new mongoose.Schema({
  shipment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "shipment",
  },
  shipment_status: {
    type: String,
  },
});
export const PackagesSchema = new mongoose.Schema({
  package_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "package",
  },
  package_number: {
    type: String,
  },
  packages_status: {
    type: String,
  },
});
export const PaymentsSchema = new mongoose.Schema({
  payment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "payment",
  },
  payment_status: {
    type: String,
  },
});
export const InvoicesSchema = new mongoose.Schema({
  invoice_id: {
    type: mongoose.Schema.Types.ObjectId,
  },
  invoice_number: {
    type: String,
  },
  invoice_status: {
    type: String,
  },
});
export const InquirySchema = new mongoose.Schema({
  inquiry_id: {
    type: mongoose.Schema.Types.ObjectId,
  },
  inquiry_number: {
    type: String,
  },
  inquiry_status: {
    type: String,
  },
});
export const QuotationSchema = new mongoose.Schema({
  quotation_id: {
    type: mongoose.Schema.Types.ObjectId,
  },
  quotation_number: {
    type: String,
  },
  quotation_status: {
    type: String,
  },
});
export const ShippingChargeTaxType = new mongoose.Schema({
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

export const taxCompositionSchema = new mongoose.Schema({
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
export const ShippingChargeTaxComposition = new mongoose.Schema({
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
    is_deal_created: {
      type: Boolean,
    },
    doc_id_gen_type: {
      type: String,
    },
    invoice_type: {
      type: String,
      enum: ESInoviceType,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "customer",
    },
    customer_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    reason: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "reason",
    },
    invoice_number: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "salesDocument",
    },
    place_of_supply: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "state",
    },
    tax_composition: [taxCompositionSchema],
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
    shipping_charge_tax_type: ShippingChargeTaxType,
    shipping_charge_tax_composition: [ShippingChargeTaxComposition],
    adjustments: {
      type: Number,
    },
    grand_total: {
      type: Number,
    },
    balance: {
      type: Number,
    },
    refund: {
      type: Number,
    },
    ledger_grand_total: {
      type: Number,
    },
    customer_notes: {
      type: String,
    },
    terms_and_cond: {
      type: String,
    },
    media: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],
    invoices: [InvoicesSchema],
    payments: [PaymentsSchema],
    packages: [PackagesSchema],
    shipments: [ShipmentsSchema],
    inquiry: InquirySchema,
    quotation: QuotationSchema,
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
