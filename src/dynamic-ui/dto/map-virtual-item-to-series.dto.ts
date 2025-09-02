import { IsString, IsArray, IsEnum, IsMongoId, IsOptional, ValidateIf } from 'class-validator';

export enum ItemType {
  QUERIES = 'queries',
  GIFT = 'gift',
  GIFT_GROUPS = 'giftGroups'
}

export class MapVirtualItemToSeriesDto {
  @IsEnum(ItemType)
  itemType: ItemType;

  @IsArray()
  @IsMongoId({ each: true })
  itemIds: string[];

  // Series mapping (required when NOT providing awardId)
  @ValidateIf(o => !o.awardId)
  @IsString()
  @IsMongoId()
  seriesId?: string;

  @ValidateIf(o => !o.awardId)
  @IsString()
  seriesName?: string;

  // Award mapping (required when NOT providing seriesId)
  @ValidateIf(o => !o.seriesId)
  @IsString()
  @IsMongoId()
  awardId?: string;

  @ValidateIf(o => !o.seriesId)
  @IsString()
  awardTitle?: string;

  @IsString()
  @IsMongoId()
  sectionId: string;

  @IsString()
  sectionName: string;
}