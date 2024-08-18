export enum EDocumentStatus {
  draft = "Draft",
  sent = "Sent",
}
export enum EType {
  save = "Save as draft",
  save_send = "Save and send",
}
export const ESDocumentStatus = [EDocumentStatus.draft, EDocumentStatus.sent];
export const ESType = [EType.save, EType.save_send];
