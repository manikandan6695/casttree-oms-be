
export enum EtaskType {
    Form = "Form",
    Video = "Video",
    Audio = "Audio",
    Anything = "Anything",
}

export const EStaskType = [
    EtaskType.Form,
    EtaskType.Video,
    EtaskType.Audio,
    EtaskType.Anything];


export enum EprocessStatus {
    Started = "Started",
    Ended = "Ended",

}

export const ESprocessStatus = [
    EprocessStatus.Started,
    EprocessStatus.Ended
]

export enum EStatus {
    Active = "Active",
    Inactive ="Inactive",

}

export const EsStatus = [
    EStatus.Active,
    EStatus.Inactive
]
export enum EtaskStatus {
    Pending = "Pending",
    InProgress = "InProgress",
    Completed = "Completed",
}
export const EStaskStatus = [
    EtaskStatus.Pending,
    EtaskStatus.InProgress,
    EtaskStatus.Completed];
