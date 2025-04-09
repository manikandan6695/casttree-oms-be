export enum EProvider {
  razorpay = "razorpay",
  cashfree = "cashfree",
  iap = "iap",
}

export const ESProvider = [EProvider.razorpay, EProvider.cashfree, EProvider.iap];

export enum EProviderId {
  razorpay = 1,
  cashfree = 2,
  iap = 3,
}
export const ESProviderId = [EProviderId.razorpay,EProviderId.cashfree,EProviderId.iap]