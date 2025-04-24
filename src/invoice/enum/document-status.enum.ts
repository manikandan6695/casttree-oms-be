export enum EDocumentStatus {
  pending = "Pending",
  completed = "Completed",
  failed = "Failed",
  expired = "Expired",
}

export const ESDocumentStatus = [
  EDocumentStatus.pending,
  EDocumentStatus.completed,
  EDocumentStatus.failed,
  EDocumentStatus.expired
];
