import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreatePeerTubeUserDTO {
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  emailId?: string;
}
