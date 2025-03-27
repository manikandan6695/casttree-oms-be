export enum EMandateStatus {
  initiated = "Initiated",
  active = "Active",
  expired = "Expired",
  bankPendingApproval = "Bank_approval_pending",
}

export const ESMandateStatus = [
  EMandateStatus.initiated,
  EMandateStatus.active,
  EMandateStatus.expired,
  EMandateStatus.bankPendingApproval,
];
