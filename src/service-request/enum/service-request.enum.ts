export enum EServiceRequestStatus {
  pending = "Pending",
  completed = "Completed",
}

export enum EServiceRequestMode {
  assign = "assignToMe",
  created = "createdByMe",
}

export const ESServiceRequestMode = [
  EServiceRequestMode.assign,
  EServiceRequestMode.created,
];

export const ESServiceRequest = [
  EServiceRequestStatus.pending,
  EServiceRequestStatus.completed,
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
