import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  ValidateIf,
  IsObject,
  ValidateNested,
  IsNotEmpty,
} from "class-validator";
import { Transform, Type } from "class-transformer";

export enum VirtualItemType {
  QUERIES = "queries",
  GIFT = "gift",
}

class MediaDto {
  @IsString()
  mediaId: string;

  @IsString()
  mediaUrl: string;
}

export class CreateVirtualItemDto {
  @IsString()
  name: string;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  price: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value === null ? null : Number(value)))
  comparePrice?: number | null;

  @IsEnum(VirtualItemType)
  type: VirtualItemType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsBoolean()
  isPayable?: boolean;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MediaDto)
  media?: MediaDto;

  @IsString()
  @IsNotEmpty()
  currencyId: string;
}
