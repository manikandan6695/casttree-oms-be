import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { EStatus } from "src/shared/enum/privacy.enum";
export class StatusDTO {
  @IsOptional()
  @IsEnum(EStatus)
  status: EStatus;
}
export class UpdateGSTSettingsDTO {
  @IsOptional()
  @IsString()
  gstin: string;

  @IsOptional()
  @IsMongoId()
  @IsString()
  business_location: string;

  @IsOptional()
  @IsString()
  @IsISO8601()
  gst_reg_on: string;

  @IsOptional()
  @IsBoolean()
  reverse_charges: boolean;

  @IsOptional()
  @IsBoolean()
  import_export: boolean;

  @IsOptional()
  @IsBoolean()
  composition_scheme: boolean;

  @IsOptional()
  @IsNumber()
  composition_scheme_percentage: number;

  @IsOptional()
  @IsString()
  composition_scheme_value: string;

  @IsOptional()
  @IsMongoId()
  @IsString()
  custom_duty_tracking_account: string;

  @IsOptional()
  @IsBoolean()
  digital_services: boolean;
}
