import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from "class-validator";

export class UserToken {
  id: string;
  userName: string;
  emailId?: string;
  phoneNumber?: string;
  state?: any;
  city?: any;
  profileId?: string;
}

export class UserTokenDTO {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  @IsString()
  user_name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  user_role: string;

  @IsOptional()
  @IsNumberString()
  phone_number?: string;

  @IsOptional()
  role?: any;

  @IsOptional()
  skills?: any;

  @IsOptional()
  country?: any;

  @IsOptional()
  state?: any;

  @IsOptional()
  city?: any;
}
