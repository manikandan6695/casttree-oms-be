import { SetMetadata } from "@nestjs/common";

export const CheckRelatedForms = (value: IRelatedFormDetails) =>
  SetMetadata("checkRelatedForms", value);

export interface IRelatedFormDetails {
  check: boolean;
  prefer_values?: boolean;
  values?: string[];
  activity_check?: string[];
}
