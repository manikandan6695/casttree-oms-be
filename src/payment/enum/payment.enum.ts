export enum ESourceType {
  serviceRequest = "serviceRequest",
}

export const ESSourceType = [ESourceType.serviceRequest];

export enum EPaymentSourceType {
  salesDocument = "salesDocument",
  serviceRequest = "serviceRequest",
  invoice = "Invoice",
  subscription = "subscription",
  processInstance = "processInstance",
}

export const ESPaymentSourceType = [
  EPaymentSourceType.salesDocument,
  EPaymentSourceType.processInstance,
  EPaymentSourceType.serviceRequest,
  EPaymentSourceType.invoice,
  EPaymentSourceType.subscription,
];

export enum EPaymentStatus {
  pending = "Pending",
  initiated = "Initiated",
  completed = "Completed",
  failed = "Failed",
}

export enum ERazorpayPaymentStatus {
  created = "created",
  authorized = "authorized",
  captured = "captured",
  refunded = "refunded",
  failed = "failed",
}

export const ESPaymentStatus = [
  EPaymentStatus.pending,
  EPaymentStatus.initiated,
  EPaymentStatus.completed,
  EPaymentStatus.failed,
];

export const ESRazorpayPaymentStatus = [
  ERazorpayPaymentStatus.created,
  ERazorpayPaymentStatus.authorized,
  ERazorpayPaymentStatus.captured,
  ERazorpayPaymentStatus.refunded,
  ERazorpayPaymentStatus.failed,
];

export enum EPaymentType {
  auth = "Auth",
  charge = "Charge",
}

export const ESPaymentType = [EPaymentType.auth, EPaymentType.charge];
