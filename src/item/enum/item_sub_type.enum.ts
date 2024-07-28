export enum EItemSubType {
  purchase_item = "Purchase Item",
  sale_item = "Sale Item",
  both = "Both",
  none = "None",
}

export enum EType {
  all = "All",
  purchase = "Purchase",
  sales = "Sales",
  both = "Both",
  none = "None",
}

export const ESItemSubType = [
  EItemSubType.purchase_item,
  EItemSubType.sale_item,
  EItemSubType.both,
  EItemSubType.none,
];

export const ESType = [
  EType.purchase,
  EType.sales,
  EType.both,
  EType.none,
  EType.all,
];
