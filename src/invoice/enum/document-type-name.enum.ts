export enum EDocumentTypeName {
  inquiry = "Inquiry",
  estimation = "Estimation",
  sale_order = "SaleOrder",
  invoice = "Invoice",
  pos_invoice = "invoice",
  package = "Package",
  shipment = "Shipment",
  payment = "Payment Received",
  transfer_order = "Transfer Order",
  retainer_invoice = "Retainer Invoice",
  delivery_challan = "Delivery Challan",
  credit_note = "Credit Note",
  expense = "Expenses",
  expense_report = "Expense Report",
  purchase_order = "Purchase Order",
  bills = "Bills",
  payment_made = "Payments Made",
  journal = "Journal",
  debit_notes = "Debit Notes",
  vendor_credits = "Vendor Credits",
  refund = "Refund",
  sale_return = "SaleReturn",
  return_receipt = "ReturnReceipt",
}

export enum ESourceType {
  serviceRequest = "serviceRequest",
}

export enum EDocument {
  sales_document = "salesDocument",
}
export const ESDocument = [EDocument.sales_document];
export const ESSourceType = [ESourceType.serviceRequest];
export const ESDocumentTypeName = [
  EDocumentTypeName.inquiry,
  EDocumentTypeName.estimation,
  EDocumentTypeName.sale_order,
  EDocumentTypeName.invoice,
  EDocumentTypeName.package,
  EDocumentTypeName.shipment,
  EDocumentTypeName.payment,
  EDocumentTypeName.transfer_order,
  EDocumentTypeName.retainer_invoice,
  EDocumentTypeName.delivery_challan,
  EDocumentTypeName.credit_note,
  EDocumentTypeName.expense,
  EDocumentTypeName.expense_report,
  EDocumentTypeName.purchase_order,
  EDocumentTypeName.bills,
  EDocumentTypeName.payment_made,
  EDocumentTypeName.journal,
  EDocumentTypeName.debit_notes,
  EDocumentTypeName.vendor_credits,
  EDocumentTypeName.refund,
  EDocumentTypeName.sale_return,
  EDocumentTypeName.return_receipt,
];
