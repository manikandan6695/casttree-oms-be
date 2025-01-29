import { IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";

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
  @IsNotEmpty()
  @IsString()
  planId: string;

  @IsOptional()
  @IsString()
  @IsMongoId()
  itemId: string;

  @IsOptional()
  @IsMongoId()
  currency : string;

  @IsOptional()
  @IsString()
  amount : string;

  @IsOptional()
  @IsMongoId()
  sourceId : string;

  @IsOptional()
  @IsString()
  sourceType : string;
}
