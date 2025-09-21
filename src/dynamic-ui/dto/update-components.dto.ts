import { IsArray, ValidateNested, IsNumber, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ObjectId } from 'mongoose';

class SeriesDto {
  @ValidateNested()
  @IsNotEmpty()
  seriesId: ObjectId;

  @IsNumber()
  @IsNotEmpty()
  order: number;
}

class ComponentDto {
  @ValidateNested()
  @IsNotEmpty()
  componentId: ObjectId;

  @IsNumber()
  @IsNotEmpty()
  order: number;

  @IsString()
  @IsNotEmpty()
  tag: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeriesDto)
  @IsNotEmpty()
  series: SeriesDto[];
}

export class EUpdateComponents {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentDto)
  @IsNotEmpty()
  components: ComponentDto[];
}