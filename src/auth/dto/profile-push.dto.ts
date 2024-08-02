import { RawTokenModel, UserToken } from "./usertoken.dto";

export class ProfilePushDTO {
  token: UserToken;
  rawToken: RawTokenModel;
}
