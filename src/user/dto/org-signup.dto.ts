import { Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { RefMediaDTO } from "src/media/dto/media.dto";

export class UserSignUpDetails {

  
  phoneNumber: string;
  emailId: string;
  userName: string;
  gender: string;
  dateOfBirth: Date;
  city: string;
  state: string;

  @ValidateIf((e) => !e.phone_number)
  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: "Enter a valid email id" })
  user_email: string;

  @ValidateIf((e) => !e.user_email)
  @IsNotEmpty()
  @IsString()
  country?: string;

  @ValidateIf((e) => !e.user_email)
  @IsNotEmpty()
  @IsString()
  phone_country_code?: string;

  @ValidateIf((e) => !e.user_email)
  @IsNotEmpty()
  @IsString()
  @IsNumberString()
  phone_number?: string;

  @ValidateIf((e) => !e.user_email)
  @IsNotEmpty()
  @IsNumber()
  otp?: number;

  @ValidateIf((e) => !e.phone_number)
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class UserSignUpDTO {
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  first_name: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsArray()
  @Type(() => RefMediaDTO)
  user_media?: RefMediaDTO[];

  @IsNotEmpty()
  @IsArray()
  @IsMongoId({ each: true })
  skills: string[];

  @IsNotEmpty()
  @IsArray()
  @IsMongoId({ each: true })
  role: string[];

  @IsOptional()
  @IsMongoId()
  @IsString()
  user_city: string;

  @IsOptional()
  @IsMongoId()
  @IsString()
  user_state: string;

  @IsOptional()
  @IsMongoId()
  @IsString()
  user_country: string;
}
