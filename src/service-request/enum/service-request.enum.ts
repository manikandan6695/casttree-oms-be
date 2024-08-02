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
