import { SetMetadata } from "@nestjs/common";

export const RequestDetails = (details: IRequestDetails) =>
  SetMetadata("requestDetails", details);

export interface IRequestDetails {
  payloadType?: AttrType;
  primaryAttrKey?: string;
  primaryRefAttrKey?: string;

  query_ref_detail?: boolean;

  formPayloadType?: AttrType;
  formAttrKey?: string;

  skip_org_check?: boolean;
  skip_parent_check?: boolean;

  include_sub_form_filter?: boolean;
  sub_form_source_id?: string;
  sub_form_source_type?: string;

  need_system_configuration?: boolean;
}

export const enum AttrType {
  body = "body",
  param = "param",
  query = "query",
}
