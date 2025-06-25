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
  coinTransaction = "coinTransaction",
  feedBack = "feedBack",
  workShop = "workShop",
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

export enum ERedisEventType {
  coinPurchase = "coin_purchase_queue",
  coinPurchaseResponse = "coin_purchase_response",
  intermediateTransfer = "intermediate_transfer",
}

export const ERedisEventTypes = [
  ERedisEventType.coinPurchase,
  ERedisEventType.coinPurchaseResponse,
  ERedisEventType.intermediateTransfer,
];


export enum EFilterType {
  // all = "All",
  purchase = "Purchase",
  withdrawal = "Withdrawal",
}
export enum ETransactionType {
  subscriptionPurchased = "Subscription Purchased",
  coinPurchased = "Coin Purchased",
  feedbackPurchased = "Feedback Purchased",
  workshopPurchased = "Workshop Purchased",
  salesDocument = "Sales Document",
}

export const ETransactionTypes = [ETransactionType.subscriptionPurchased, ETransactionType.coinPurchased, ETransactionType.feedbackPurchased, ETransactionType.workshopPurchased, ETransactionType.salesDocument];
export enum ETransactionState {
  In= "IN",
  Out= "OUT",
}

export enum ECurrencyName {
  casttreeCoin = "Casttree Coin",
  currencyId = "6852c906a72125c5fcf9f61f"
}
export enum ECoinStatus{
  active = "Active",
  pending = "Pending",
  completed = "Completed",
  failed = "Failed",
  inactive = "Inactive",
}
export const ESCoinStatus = [
  ECoinStatus.pending,
  ECoinStatus.failed,
  ECoinStatus.completed,
  ECoinStatus.active,
  ECoinStatus.inactive,
];
export enum EDocumentStatus{
  pending = "Pending",
  failed = "Failed",
  completed = "Completed",
}
export enum ETransactionType{
  In = "In",
  Out = "Out",
  earned = "earned",
  spent = "spent",
  withdrawal = "Withdrawal",
  purchased = "purchased",
}

