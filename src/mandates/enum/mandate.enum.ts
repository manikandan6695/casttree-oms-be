export enum EMandateStatus {
  initiated = "Initiated",
  active = "Active",
  expired = "Expired",
  bankPendingApproval = "Bank_approval_pending",
  cancelled = "Cancelled",
  cancel_initiated = "Cancel_Initiated",
  paused = "Paused",
  rejected = "Rejected",
}

export const ESMandateStatus = [
  EMandateStatus.initiated,
  EMandateStatus.active,
  EMandateStatus.expired,
  EMandateStatus.bankPendingApproval,
  EMandateStatus.cancelled,
  EMandateStatus.paused,
  EMandateStatus.rejected,
];
