import { IsOptional, IsString, IsDateString } from 'class-validator';

export class MixpanelExportDto {
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsString()
  event?: string;
}
