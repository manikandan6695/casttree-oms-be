export enum EServiceRequestStatus {
  pending = "Pending",
  completed = "Completed",
}

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