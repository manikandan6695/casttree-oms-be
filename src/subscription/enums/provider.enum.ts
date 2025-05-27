export enum EProvider {
  razorpay = "razorpay",
  cashfree = "cashfree",
  apple = "apple",
  google = "google",
}

export const ESProvider = [
  EProvider.razorpay,
  EProvider.cashfree,
  EProvider.apple,
  EProvider.google,
];

export enum EProviderId {
  razorpay = 1,
  cashfree = 2,
  apple = 3,
  google = 4,
}
export const ESProviderId = [
  EProviderId.razorpay,
  EProviderId.cashfree,
  EProviderId.apple,
  EProviderId.google,
];
export enum EProviderName {
  apple = "Apple IAP",
  google = "Google IAP",
}