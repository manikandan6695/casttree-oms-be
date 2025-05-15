import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateTaxDTO {
  @IsNotEmpty()
  @IsString()
  tax_name: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsOptional()
  @IsNumber()
  tax_rate: number;

  @IsOptional()
  tax_type: any;

  @IsOptional()
  @IsArray()
  taxes: string[];
}
