import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from "class-validator";
import { EStatus } from "src/shared/enum/privacy.enum";
import { ESPAppType } from "../enum/app-type.enum";

export class AppCredentialDTO {
  @IsString()
  @IsMongoId()
  @IsNotEmpty()
  organization_id: string;

  @IsString()
  @IsMongoId()
  @IsNotEmpty()
  type_id: string;

  @IsString()
  @IsMongoId()
  @IsNotEmpty()
  application_id: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(ESPAppType)
  type_key: ESPAppType;

  @IsString()
  @IsNotEmpty()
  application_key: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FieldValuesDTO)
  field_values: FieldValuesDTO[];

  @IsString()
  @IsNotEmpty()
  @IsEnum(EStatus)
  status: EStatus;

  @IsBoolean()
  @IsNotEmpty()
  is_primary: boolean;
}

export class FieldValuesDTO {
  @IsString()
  @IsNotEmpty()
  field_key: string;

  @IsString()
  @IsNotEmpty()
  field_value: string;
}

export class EditAppCredentialsDTO {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FieldValuesDTO)
  field_values: FieldValuesDTO[];
}
