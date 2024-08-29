import { IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UserDetailDTO {
  @IsNotEmpty()
  @IsString()
  phoneCountryCode: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  emailId: string;

  @IsNotEmpty()
  @IsString()
  userName: string;

  @IsOptional()
  @IsMongoId()
  nominationId?: string;
}
