import { IsNotEmpty, IsString, IsBoolean, IsNumber } from "class-validator";

export class ParentOrgMapping {
  @IsNotEmpty()
  @IsString()
  realmIdentifier: string;
  @IsNotEmpty()
  @IsNumber()
  userId: number;
  @IsNotEmpty()
  @IsBoolean()
  primaryRealm: boolean;
  @IsNotEmpty()
  @IsString()
  role: string;
}
