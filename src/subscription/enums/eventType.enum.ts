export enum EEventType {
  subscriptionStatusChanged = "SUBSCRIPTION_STATUS_CHANGED",
  subscriptionPaymentSuccess = "SUBSCRIPTION_PAYMENT_SUCCESS",
  subscriptionPaymentFailed = "SUBSCRIPTION_PAYMENT_FAILED",
  didRenew = "DID_RENEW",
  didCancel = "REVOKE",
  didPurchase = "SUBSCRIBED",
  expired = "EXPIRED",
  subTypeInitial = "INITIAL_BUY",
  subTypeReSub = "RESUBSCRIBE",
  subTypeRenew = "BILLING_RECOVERY",
  subTypeCancel = "AUTO_RENEW_DISABLED",
  expiredSubType = "VOLUNTARY",
  expiredSubTypeBilling = "BILLING_RETRY",
  expiredSubTypePrice = "PRICE_INCREASE",
  expiredSubTypeNotForSale = "PRODUCT_NOT_FOR_SALE",
  Remew = "SUBSCRIPTION_RENEWED",
  Cancel = "SUBSCRIPTION_CANCELED",
  Purchase = "SUBSCRIPTION_PURCHASED",
  tokenConfirmed = "token.confirmed",
  tokenCancelled = "token.cancellation_initiated",
  paymentAuthorized = "payment.authorized",
  paymentCaptured = "payment.captured",
  paymentFailed = "payment.failed",
  tokenCancel = "token.cancelled",
  tokenPaused = "token.paused",
  tokenRejected = "token.rejected",
  paymentRefunded = "refund.processed",
  didChangeRenewalStatus= "DID_CHANGE_RENEWAL_STATUS",
  autoRenewDisabled="AUTO_RENEW_DISABLED"
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
  EEventType.expired,
  EEventType.expiredSubType,
  EEventType.paymentRefunded,
  EEventType.didChangeRenewalStatus,
  EEventType.autoRenewDisabled
];

export enum EEventId {
  renew = 2,
  cancel = 3,
  purchase = 4,
}
export const ESEventId = [EEventId.renew, EEventId.cancel, EEventId.purchase];
export enum EReferralStatus{
  Onboarded = "Onboarded",
}