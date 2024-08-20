export enum EPaymentProvider {
  razorpay = "razorpay",
}

export enum EPaymentOrderStatus {
  pending = "pending",
  paid = "paid",
  cancelled = "cancelled",
  dropped = "dropped",
}

export const ESPaymentOrderStatus = [
  EPaymentOrderStatus.cancelled,
  EPaymentOrderStatus.dropped,
  EPaymentOrderStatus.paid,
  EPaymentOrderStatus.pending,
];
