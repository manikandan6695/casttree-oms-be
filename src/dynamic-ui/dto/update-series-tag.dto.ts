import {
  IsString,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  ValidateNested,
  IsObject,
} from "class-validator";
import { Type } from "class-transformer";

class SeriesItemDto {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  id: string;
}

export class EUpdateSeriesTag {
  @IsString()
  @IsNotEmpty()
  tag: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeriesItemDto)
  @IsNotEmpty()
  selected: SeriesItemDto[];

  @IsMongoId()
  @IsNotEmpty()
  componentId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeriesItemDto)
  @IsNotEmpty()
  unselected: SeriesItemDto[];
}
