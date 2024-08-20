export enum ESourceType {
  serviceRequest = "serviceRequest",
}

export const ESSourceType = [ESourceType.serviceRequest];

export enum EPaymentStatus {
  pending = "Pending",
  initiated = "Initiated",
  completed = "Completed",
  failed = "Failed",
}

export const ESPaymentStatus = [
  EPaymentStatus.pending,
  EPaymentStatus.initiated,
  EPaymentStatus.completed,
  EPaymentStatus.failed,
];
