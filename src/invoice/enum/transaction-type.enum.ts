export enum ETransactionType {
  in = "In",
  out = "Out",
  none = "None",
}
export enum ECompositeItemSourceType {
  item = "item",
  associatedItems = "associatedItems",
}
export enum EDocumentNumberType {
  auto = "Auto",
  manual = "Manual",
}

export enum EInvoiceType {
  pos = "pos",
  tecxprt = "tecxprt",
}
export const ESTransactionType = [ETransactionType.in, ETransactionType.out];
export const ESCompositeItemSourceType = [
  ECompositeItemSourceType.item,
  ECompositeItemSourceType.associatedItems,
];
export const ESDocumentNumberType = [
  EDocumentNumberType.auto,
  EDocumentNumberType.manual,
];

export const ESInoviceType = [EInvoiceType.pos, EInvoiceType.tecxprt];
