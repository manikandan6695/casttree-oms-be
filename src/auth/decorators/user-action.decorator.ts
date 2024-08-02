import { SetMetadata } from "@nestjs/common";
import { IRequestDetails } from "./request-details.decorator";

export const UserActionType = (details: IActionDetails) =>
  SetMetadata("userAction", details);

export interface IActionDetails {
  actionType?: EActionType;
  action?: EUserActions;
  actionSubType?: EActionSubType;
  formType?: EActionType;
  formDetails?: IRequestDetails;
  formCode?: string | any;
  formId?: string;
}

export const enum EActionType {
  implicit = "implicit",
  explicit = "explicit",
}
export const enum EActionSubType {
  list = "list",
  detail = "detail",
}

export enum EUserActions {
  create = "create",
  view = "view",
  delete = "delete",
  edit = "edit",
}

export const ESUserActions = [
  EUserActions.create,
  EUserActions.view,
  EUserActions.delete,
  EUserActions.edit,
];

export enum EActionCheck {
  create = "checkForAccess",
  delete = "checkResourceAccess",
  edit = "checkResourceAccess",
  view = "returnFilters",
  list = "returnFilters",
  detail = "checkResourceAccess",
}
