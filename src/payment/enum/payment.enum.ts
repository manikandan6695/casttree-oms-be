export enum ESourceType {
  serviceRequest = "serviceRequest",
}

export const ESSourceType = [ESourceType.serviceRequest];

export enum EPaymentSourceType {
  salesDocument = "salesDocument",
  processInstance = "processInstance",
  serviceRequest = "serviceRequest",
  invoice = "Invoice",
  subscription = "subscription",
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
