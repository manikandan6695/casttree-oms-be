import { Type } from "class-transformer";
import {
  IsArray,
  IsISO8601,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { RefMediaDTO } from "src/media/dto/media.dto";

export class WebLinksDTO {
  @IsOptional()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  link: string;
}

export class LanguageDTO {
  @IsOptional()
  @IsMongoId()
  language_id: string;

  @IsOptional()
  @IsString()
  read: string;

  @IsOptional()
  @IsString()
  write: string;

  @IsOptional()
  @IsString()
  speak: string;
}
export class UpdateUserDTO {
  @IsNotEmpty()
  @IsString()
  phoneCountryCode: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  emailId: string;

  @IsNotEmpty()
  @IsString()
  userName: string;

  @IsOptional()
  @Type(() => RefMediaDTO)
  media?: RefMediaDTO[];

  @IsNotEmpty()
  @IsMongoId()
  city: string;

  @IsNotEmpty()
  @IsMongoId()
  state: string;

  @IsNotEmpty()
  @IsString()
  gender: string;

  @IsNotEmpty()
  @IsISO8601()
  dateOfBirth: Date;

  @IsOptional()
  @IsMongoId()
  organizationId : string
}

export class UpdateContactDTO {
  @IsOptional()
  @IsString()
  emailId: string;

  @IsOptional()
  @IsString()
  userName: string;

  @IsOptional()
  @IsMongoId()
  city: string;

  @IsOptional()
  @IsMongoId()
  state: string;

  @IsOptional()
  @IsString()
  gender: string;

  @IsOptional()
  @IsISO8601()
  dateOfBirth: Date;
}
