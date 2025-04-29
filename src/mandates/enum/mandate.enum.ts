export enum EMandateStatus {
  initiated = "Initiated",
  active = "Active",
  expired = "Expired",
  bankPendingApproval = "Bank_approval_pending",
  cancelled = "Cancelled",
}

export const ESMandateStatus = [
  EMandateStatus.initiated,
  EMandateStatus.active,
  EMandateStatus.expired,
  EMandateStatus.bankPendingApproval,
  EMandateStatus.cancelled,
];
