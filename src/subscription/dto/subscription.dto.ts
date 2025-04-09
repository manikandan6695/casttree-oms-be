import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsObject,
  ValidateNested
} from "class-validator";
import { EProvider } from "../enums/provider.enum";
import { Type } from "class-transformer";
class TransactionDetailsDTO{
  @IsNotEmpty()
  @IsString()
  externalId: string;
}
export class CreateSubscriptionDTO {
  @IsNotEmpty()
  @IsString()
  planId: string;

  @IsOptional()
  @IsString()
  @IsMongoId()
  itemId: string;

  @IsOptional()
  @IsString()
  @IsMongoId()
  sourceId: string;

  @IsOptional()
  @IsString()
  sourceType: string;

  @IsNotEmpty()
  @IsEnum(EProvider)
  provider: EProvider;

  @IsOptional()
  @IsNumber()
  authAmount: number;

  @IsOptional()
  @IsString()
  redirectionUrl: string;

  @IsOptional()
  @IsNumber()
  validity: number;

  @IsOptional()
  @IsString()
  validityType: string;

  @IsOptional()
  @IsNumber()
  subscriptionExpiry: number;
  @IsOptional()
  @IsString()
  providerId: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(()=> TransactionDetailsDTO)
  transactionDetails: TransactionDetailsDTO;
}

export class AddSubscriptionDTO {
  @IsNotEmpty()
  @IsMongoId()
  itemId: string;

  @IsNotEmpty()
  @IsString()
  currency: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsNumber()
  validity: number;

  @IsOptional()
  @IsString()
  validityType: string;
}

export class ValidateSubscriptionDTO {
  @IsOptional()
  status: string[];
}
export interface ITransactionHistoryResponse {
  revision: string;
  bundleId: string;
  environment: string;
  hasMore: boolean;
  signedTransactions: string[];
}