import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class PeerTubeUserDTO {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  grantType?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;
}
