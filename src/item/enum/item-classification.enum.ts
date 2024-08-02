export enum EItemClassification {
  single = "Single",
  group = "Group",
  group_item = "Group Item",
  composite_item = "Composite Item",
}

export const ESItemClassification = [
  EItemClassification.single,
  EItemClassification.group,
  EItemClassification.group_item,
];

export enum EItemsStatus {
  Active = "Active",
  Inactive = "Inactive",
}
export enum EItemsFilter {
  all = "All",
  Inventory = "Inventory",
  non_inventory = "Non Inventory",
  Active = "Active",
  Inactive = "Inactive",
}
export const ESIItemsStatus = [EItemsStatus.Active, EItemsStatus.Inactive];

export const ESItemsFilter = [
  EItemsFilter.all,
  EItemsFilter.Active,
  EItemsFilter.Inactive,
  EItemsFilter.Inventory,
  EItemsFilter.non_inventory,
];
