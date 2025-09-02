import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, ValidateIf, IsObject, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum VirtualItemType {
  QUERIES = 'queries',
  GIFT = 'gift'
}

export enum VirtualItemStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending'
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
  @Transform(({ value }) => value === null ? null : Number(value))
  comparePrice?: number | null;

  @IsString()
  sectionId: string;

  @IsString()
  sectionName: string;

  @IsString()
  seriesId: string;

  @IsString()
  seriesName: string;

  @IsEnum(VirtualItemStatus)
  @IsOptional()
  status?: VirtualItemStatus;

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
}
