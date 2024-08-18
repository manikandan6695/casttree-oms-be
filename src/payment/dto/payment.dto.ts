import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { ESourceType } from "../enum/payment.enum";

export class InvoiceDTO {
  @IsNotEmpty()
  @IsString()
  sourceId: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(ESourceType)
  sourceType: ESourceType;
}
export class paymentDTO {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency: string;

  @IsOptional()
  @IsString()
  paymentMode: string;

  @IsOptional()
  @IsMongoId()
  userId: string;

  @IsNotEmpty()
  invoiceDetail: InvoiceDTO;
}
