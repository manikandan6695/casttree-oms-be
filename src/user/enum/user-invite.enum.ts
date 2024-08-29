export enum EUserStatus {
  Invited = "Invited",
  Active = "Active",
  Inactive = "Inactive",
  Onboarded = "On Boarded",
}

export enum EUserAccountStatus {
  new = "New",
  invited = "Invited",
  active = "Active",
  inactive = "Inactive"
}

export const ESUserStatus = ["Invited", "Active", "Inactive"];
export const ESUserAccountStatus = [
  EUserAccountStatus.new,
  EUserAccountStatus.invited,
  EUserAccountStatus.active,
];
