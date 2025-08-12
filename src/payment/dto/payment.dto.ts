import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { AddServiceRequestDTO } from "src/service-request/dto/add-service-request.dto";
import { EFilterType, EPaymentSourceType } from "../enum/payment.enum";

export class InvoiceDTO {
  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsString()
  @IsEnum(EPaymentSourceType)
  sourceType?: EPaymentSourceType;
}
class TransactionDetailsDTO {
  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsString()
  originalTransactionId?: string;

  @IsOptional()
  @IsNumber()
  authAmount?: number;

  @IsOptional()
  @IsNumber()
  transactionDate?: number;
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

  @IsOptional()
  @IsString()
  paymentType?: string;

  @IsOptional()
  @IsString()
  providerName?: string;

  @IsOptional()
  @IsNumber()
  providerId?: number;

  @IsOptional()
  @IsISO8601()
  transactionDate?: Date;
  @IsOptional()
  @ValidateNested()
  @Type(() => TransactionDetailsDTO)
  transactionDetails?: TransactionDetailsDTO;
}
export class filterTypeDTO{
  @IsOptional()
  @IsEnum(EFilterType)
  filterType?: EFilterType;
}
export class paymentIsSentToMetaDTO{
  @IsNotEmpty()
  @IsBoolean()
  isSentToMeta: boolean;
}