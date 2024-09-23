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
}

export const ESSourceType = [ESourceType.serviceRequest];

export enum EVisibilityStatus {
  unlocked = "Unlocked",
  locked = "Locked",
}

export const ESVisibilityStatus = [
  EVisibilityStatus.unlocked,
  EVisibilityStatus.locked,
];
