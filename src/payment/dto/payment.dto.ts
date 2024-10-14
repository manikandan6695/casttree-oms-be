import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { AddServiceRequestDTO } from "src/service-request/dto/add-service-request.dto";
import { ESourceType } from "../enum/payment.enum";

export class InvoiceDTO {
  @IsOptional()
  @IsString()
  sourceId: string;

  @IsOptional()
  @IsString()
  @IsEnum(ESourceType)
  sourceType: ESourceType;
}

export class paymentDTO {
  @IsNotEmpty()
  @IsNumber()
  amount: number;
  
  @IsNotEmpty()
  @IsNumber()
  actualPrice: number;

  @IsOptional()
  @IsString()
  currency: string;

  @IsOptional()
  @IsString()
  couponCode: string;

  @IsOptional()
  @IsNumber()
  discount: number;

  @IsOptional()
  serviceRequest: AddServiceRequestDTO;

  @IsOptional()
  @IsString()
  paymentMode: string;

  @IsOptional()
  @IsMongoId()
  userId: string;

  @IsOptional()
  invoiceDetail: InvoiceDTO;
}
