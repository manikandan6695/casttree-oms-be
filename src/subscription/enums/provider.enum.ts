export enum EProvider {
  razorpay = "razorpay",
  cashfree = "cashfree",
  apple = "apple",
  google = "google",
  phonepe = "phonepe",
}

export const ESProvider = [
  EProvider.razorpay,
  EProvider.cashfree,
  EProvider.apple,
  EProvider.google,
  EProvider.phonepe,
];

export enum EProviderId {
  razorpay = 1,
  cashfree = 2,
  apple = 3,
  google = 4,
  phonepe = 5,
}
export const ESProviderId = [
  EProviderId.razorpay,
  EProviderId.cashfree,
  EProviderId.apple,
  EProviderId.google,
  EProviderId.phonepe,
];
export enum EProviderName {
  apple = "Apple IAP",
  google = "Google IAP",
}
export enum EErrorHandler {
  notFound = "No active subscription found"
}
export enum ESubscriptionMode {
  Auth = "Auth",
  Charge = "Charge",
}