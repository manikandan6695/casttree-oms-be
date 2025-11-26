export class UserToken {
  id: string;
  user_name: string;
  email: string;
  phone_number?: string;
  realm_identifier?: string;
  system_user_id?: string;
  userOrgId?: string;
  profileId?: string;
  phoneNumber: string;
}

export class RawTokenModel {
  token: string;
  tokenType?: string;
}
