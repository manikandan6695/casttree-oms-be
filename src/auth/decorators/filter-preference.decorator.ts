import { SetMetadata } from "@nestjs/common";

export const FilterPreference = (value: IFilterPreferenceDetail) =>
  SetMetadata("filterPreference", value);

export interface IFilterPreferenceDetail {
  need_organization_id?: boolean;

  need_user_id?: boolean;
  use_dyanmic_user_fields?: boolean;
  user_variable_names?: string[];

  need_customer_id?: boolean;
  use_dyanmic_customer_fields?: boolean;
  customer_variable_names?: string[];

  need_vendor_id?: boolean;
  use_dyanmic_vendor_fields?: boolean;
  vendor_variable_names?: string[];

  need_branch_id?: boolean;
  use_dyanmic_branch_fields?: boolean;
  branch_variable_names?: string[];

  need_warehouse_id?: boolean;
  use_dyanmic_warehouse_fields?: boolean;
  warehouse_variable_names?: string[];

  check_against_user_id?: boolean;
  check_against_customer_id?: boolean;
  check_against_branch_id?: boolean;
  check_against_warehouse_id?: boolean;
}
