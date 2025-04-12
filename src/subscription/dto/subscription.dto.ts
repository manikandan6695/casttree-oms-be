import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsObject,
  ValidateNested,
} from "class-validator";
import { EProvider } from "../enums/provider.enum";
import { Type } from "class-transformer";
import { EDocumentStatus } from "src/invoice/enum/document-status.enum";
import { EStatus } from "src/service-request/enum/service-request.enum";
class TransactionDetailsDTO {
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
  @Type(() => TransactionDetailsDTO)
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
export interface CashfreeFailedPaymentPayload {
  data: {
    cf_payment_id: string;
    subscription_id: string;
    failureDetails: string;
  };
}

export interface RazorpaySubscriptionPayload {
  subscription: {
    entity: {
      notes: {
        userId: string;
        sourceId: string;
        itemId: string;
      };
      plan_id: string;
      total_count: number;
      current_start: number;
      quantity: number;
      current_end: number;
      change_scheduled_at: number;
      end_at: number;
      paid_count: number;
      expire_by: number;
      status: string;
    };
  };
  payment: {
    entity: {
      amount: number;
    };
  };
}

export interface SubscriptionData {
  userId: string;
  planId: string;
  totalCount: number;
  currentStart: number;
  quantity: number;
  currentEnd: number;
  scheduleChangeAt: number;
  endAt: number;
  paidCount: number;
  expireBy: number;
  notes: object;
  subscriptionStatus: string;
  metaData: RazorpaySubscriptionPayload;
  status: EStatus;
  createdBy: string;
  updatedBy: string;
}

export interface InvoiceData {
  source_id: string;
  source_type: string;
  sub_total: number;
  document_status: EDocumentStatus;
  grand_total: number;
}

export interface PaymentRecordData {
  amount: number;
  invoiceDetail: { sourceId: string };
  document_status: EDocumentStatus;
}

export interface UserUpdateData {
  userId: string;
  membership: string;
  badge: string;
}

export interface CashfreeStatusChangePayload {
  data: {
    subscription_id: string;
    subscription_status: string;
  };
}
export interface CashfreeNewPaymentPayloadData {
  cf_payment_id: string;
}

export interface CashfreeNewPaymentPayload {
  data: CashfreeNewPaymentPayloadData;
}
export interface CancelSubscriptionBody {
  reason?: string;
}

export interface UpdatePaymentBody {
  document_status: string;
}
