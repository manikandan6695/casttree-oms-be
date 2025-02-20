export enum EServiceRequestStatus {
  initiated = "Initiated",
  pending = "Pending",
  completed = "Completed",
}

export enum EServiceRequestMode {
  assign = "assignToMe",
  created = "createdByMe",
}

export const ESServiceRequest = [
  EServiceRequestStatus.initiated,
  EServiceRequestStatus.pending,
  EServiceRequestStatus.completed,
];

export const ESServiceRequestMode = [
  EServiceRequestMode.assign,
  EServiceRequestMode.created,
];

export enum ESourceType {
  serviceRequest = "ServiceRequest",
  salesDocument = "salesDocument",
}

export const ESSourceType = [
  ESourceType.serviceRequest,
  ESourceType.salesDocument,
];

export enum EVisibilityStatus {
  unlocked = "Unlocked",
  locked = "Locked",
}

export const ESVisibilityStatus = [
  EVisibilityStatus.unlocked,
  EVisibilityStatus.locked,
];

export enum EProfileType {
  Expert = "Expert",

}

export const ESProfileType = [
  EProfileType.Expert,

];

export enum ERequestType {
  requestedToUser = "requestedToUser",

}

export const ESRequestType = [
  ERequestType.requestedToUser,

];
export enum EStatus {
  Active = "Active",
  Inactive = "Inactive",
}

export const ESStatus = [
  EStatus.Active,
  EStatus.Inactive,
];

export enum EFeatureType {
  workShopDiscount = "Discount on Workshops",

}

export const ESFeatureType = [
  EFeatureType.workShopDiscount

];
