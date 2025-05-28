import {
  IsBoolean,
  IsISO8601,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateGSTSettingsDTO {
  @IsNotEmpty()
  @IsString()
  gstin: string;

  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  business_location: string;

  @IsOptional()
  @IsString()
  @IsISO8601()
  gst_reg_on?: string;

  @IsOptional()
  @IsBoolean()
  reverse_charges?: boolean;

  @IsOptional()
  @IsBoolean()
  import_export?: boolean;

  @IsOptional()
  @IsBoolean()
  composition_scheme?: boolean;

  @IsOptional()
  @IsNumber()
  composition_scheme_percentage?: number;

  @IsOptional()
  @IsString()
  composition_scheme_value?: string;

  @IsOptional()
  @IsMongoId()
  @IsString()
  custom_duty_tracking_account?: string;

  @IsOptional()
  @IsBoolean()
  digital_services?: boolean;
}
