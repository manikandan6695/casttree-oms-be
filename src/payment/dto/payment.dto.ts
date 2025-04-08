import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString
} from "class-validator";
import { AddServiceRequestDTO } from "src/service-request/dto/add-service-request.dto";
import { EPaymentSourceType } from "../enum/payment.enum";

export class InvoiceDTO {
  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsString()
  @IsEnum(EPaymentSourceType)
  sourceType?: EPaymentSourceType;
}

export class paymentDTO {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  document_status: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  serviceRequest?: AddServiceRequestDTO;

  @IsOptional()
  @IsString()
  paymentMode?: string;

  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  invoiceDetail?: InvoiceDTO;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsMongoId()
  itemId?: string;


}
