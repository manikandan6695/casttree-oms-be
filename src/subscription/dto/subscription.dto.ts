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
  @IsNotEmpty()
  @IsMongoId()
  itemId: string;

  @IsNotEmpty()
  @IsString()
  currency : string;

  @IsNotEmpty()
  @IsNumber()
  amount : number;

  @IsOptional()
  @IsNumber()
  validity: number

  @IsOptional()
  @IsString()
  validityType: string
}
