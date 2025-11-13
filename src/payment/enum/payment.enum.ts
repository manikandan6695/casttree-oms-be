export enum ESourceType {
  serviceRequest = "serviceRequest",
}

export const ESSourceType = [ESourceType.serviceRequest];

export enum EPaymentSourceType {
  serviceRequest = "serviceRequest",
  invoice = "Invoice",
  subscription = "subscription",
  processInstance = "processInstance",
  coinTransaction = "coinTransaction",
  feedback = "feedback",
  workshop = "workshop",
}

export const ESPaymentSourceType = [
  EPaymentSourceType.processInstance,
  EPaymentSourceType.serviceRequest,
  EPaymentSourceType.invoice,
  EPaymentSourceType.subscription,
  EPaymentSourceType.workshop,
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
  coinTrancationId = "coin_trancation_id",
}

export const ERedisEventTypes = [
  ERedisEventType.coinPurchase,
  ERedisEventType.coinPurchaseResponse,
  ERedisEventType.intermediateTransfer,
  ERedisEventType.coinTrancationId,
];

export enum EFilterType {
  // all = "All",
  purchase = "Purchase",
  withdrawal = "Withdrawal",
  withdrawn = "withdrawn",
}
export enum ETransactionType {
  subscriptionPurchased = "Subscription Purchased",
  coinPurchased = "Coin Purchased",
  feedbackPurchased = "Feedback Purchased",
  workshopPurchased = "Workshop Purchased",
  coursePurchased = "Course Purchased",
}

export enum ESourceTypes {
  subscription = "Subscription",
  coin = "Coin",
  feedback = "Feedback",
  workshop = "Workshop",
}

export const ESSourceTypes = [
  ESourceTypes.coin,
  ESourceTypes.subscription,
  ESourceTypes.feedback,
  ESourceTypes.workshop,
];

export const ETransactionTypes = [
  ETransactionType.subscriptionPurchased,
  ETransactionType.coinPurchased,
  ETransactionType.feedbackPurchased,
  ETransactionType.workshopPurchased,
  ETransactionType.coursePurchased,
];
export enum ETransactionState {
  In = "IN",
  Out = "OUT",
}

export enum ECurrencyName {
  casttreeCoin = "Casttree Coin",
  currencyId = "6852c906a72125c5fcf9f61f",
}
export enum ECoinStatus {
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
export enum EDocumentStatus {
  pending = "Pending",
  failed = "Failed",
  completed = "Completed",
}
export enum ETransactionType {
  In = "In",
  Out = "Out",
  earned = "earned",
  spent = "spent",
  withdrawal = "Withdrawal",
  purchased = "purchased",
  withdrawn = "withdrawn",
}
export enum EAdminId {
  userId = "664c8992ac53bc60fb5fb85e"
}
export enum ECoinTransactionTypes {
  In = "In",
  Out = "Out",
  earned = "earned",
  spent = "spent",
  withdrawal = "Withdrawal",
  purchased = "purchased",
  withdrawn = "withdrawn",
  coinTransaction = "coinTransaction"
}
export enum EPaymentProvider {
  paymentProvider = "payment_provider",
}