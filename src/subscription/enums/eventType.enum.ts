export enum EEventType {
  subscriptionStatusChanged = "SUBSCRIPTION_STATUS_CHANGED",
  subscriptionPaymentSuccess = "SUBSCRIPTION_PAYMENT_SUCCESS",
  subscriptionPaymentFailed = "SUBSCRIPTION_PAYMENT_FAILED",
  didRenew = "DID_RENEW",
  didCancel = "REVOKE",
  didPurchase = "SUBSCRIBED",
  subTypeInitial = "INITIAL_BUY",
  subTypeReSub="RESUBSCRIBE",
  subTypeRenew="BILLING_RECOVERY",
  subTypeCancel="AUTO_RENEW_DISABLED",
  Remew="SUBSCRIPTION_RENEWED",
  Cancel="SUBSCRIPTION_CANCELED",
  Purchase="SUBSCRIPTION_PURCHASED",
}

export const ESEventType = [
  EEventType.subscriptionStatusChanged,
  EEventType.subscriptionPaymentSuccess,
  EEventType.subscriptionPaymentFailed,
  EEventType.didRenew,
  EEventType.didCancel,
  EEventType.didPurchase,
  EEventType.Remew,
  EEventType.Cancel,
  EEventType.Purchase,
  EEventType.subTypeInitial,
  EEventType.subTypeRenew,
  EEventType.subTypeCancel,
  EEventType.subTypeReSub,
];

export enum EEventId{
  renew = 2,
  cancel = 3,
  purchase = 4,
}
export const ESEventId = [EEventId.renew,EEventId.cancel,EEventId.purchase]