import { SetMetadata } from "@nestjs/common";

export const DoAuthorityCheck = (value: boolean) =>
  SetMetadata("doAuthorityCheck", value);
