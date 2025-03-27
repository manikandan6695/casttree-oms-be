export enum EtaskType {
  Form = "Form",
  Video = "Video",
  Audio = "Audio",
  Anything = "Anything",
  Break = "Break",
}

export const EStaskType = [
  EtaskType.Form,
  EtaskType.Video,
  EtaskType.Audio,
  EtaskType.Anything,
  EtaskType.Break,
];

export enum EprocessStatus {
  Started = "Started",
  Completed = "Completed",
}

export const ESprocessStatus = [
  EprocessStatus.Started,
  EprocessStatus.Completed,
];

export enum EStatus {
  Active = "Active",
  Inactive = "Inactive",
}

export const EsStatus = [EStatus.Active, EStatus.Inactive];
export enum EtaskStatus {
  Pending = "Pending",
  InProgress = "InProgress",
  Completed = "Completed",
}
export const EStaskStatus = [
  EtaskStatus.Pending,
  EtaskStatus.InProgress,
  EtaskStatus.Completed,
];

export enum EsubscriptionStatus {
  initiated = "Initiated",
  expired = "Expired",
  active = "Active",
  pending = "Pending",
  failed = "Failed",
}
export const ESsubscriptionStatus = [
  EsubscriptionStatus.initiated,
  EsubscriptionStatus.expired,
  EsubscriptionStatus.active,
  EsubscriptionStatus.pending,
  EsubscriptionStatus.failed,
];
