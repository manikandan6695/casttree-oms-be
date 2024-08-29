export enum EConnectionsStatus {
  not_connected = "Not Connected",
  pending = "Pending",
  approved = "Approved",
  rejected = "Rejected",
  revoked = "Revoked",
  blocked = "Blocked",
}

export const ESConnectionStatus = [
  EConnectionsStatus.not_connected,
  EConnectionsStatus.approved,
  EConnectionsStatus.pending,
  EConnectionsStatus.rejected,
  EConnectionsStatus.revoked,
  EConnectionsStatus.blocked,
];

export enum EDocStatus {
  active = "Active",
  inActive = "Inactive",
}

export const ESDocStatus = [EDocStatus.active, EDocStatus.inActive];

export enum EConnectionType {
  sent = "Sent",
  received = "Received",
}

export enum ERequestType {
  connection = "Connection",
  follow = "Follow",
}

export const ESConnectionType = [ERequestType.connection, ERequestType.follow];
