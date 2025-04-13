export enum EEventType {
  subscriptionStatusChanged = "SUBSCRIPTION_STATUS_CHANGED",
  subscriptionPaymentSuccess = "SUBSCRIPTION_PAYMENT_SUCCESS",
  subscriptionPaymentFailed = "SUBSCRIPTION_PAYMENT_FAILED",
  didRenew = "DID_RENEW",
  didCancel = "DID_CANCEL",
  didPurchase = "DID_PURCHASE",
}

export const ESEventType = [
  EEventType.subscriptionStatusChanged,
  EEventType.subscriptionPaymentSuccess,
  EEventType.subscriptionPaymentFailed,
  EEventType.didRenew,
  EEventType.didCancel,
  EEventType.didPurchase,
];
