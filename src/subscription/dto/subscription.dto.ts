import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

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
  sourceId : string;

  @IsOptional()
  @IsString()
  sourceType : string;
}

export class AddSubscriptionDTO {
  @IsOptional()
  @IsMongoId()
  itemId: string;

  @IsOptional()
  @IsString()
  currency : string;

  @IsOptional()
  @IsNumber()
  amount : string;
}
