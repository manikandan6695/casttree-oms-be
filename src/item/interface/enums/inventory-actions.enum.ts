export enum EInventoryActions {
  opening_balance_created = "Opening Balance Created",
  opening_balance_updated = "Opening Balance Updated",
  bill_created = "Bill Created",
  bill_updated = "Bill Updated",
  invoice_created = "Invoice Created",
  invoice_updated = "Invoice Updated",
}

export const ESInventoryActions = [
  EInventoryActions.opening_balance_created,
  EInventoryActions.opening_balance_updated,
  EInventoryActions.bill_created,
  EInventoryActions.bill_updated,
  EInventoryActions.invoice_created,
  EInventoryActions.invoice_updated,
];

export enum ETransactionType {
  in = "In",
  out = "Out",
  none = "None",
}

export const ESTransactionType = [ETransactionType.in, ETransactionType.out];
