import { IsArray, ValidateNested, IsObject, IsNumber, IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class ObjectIdDto {
  @IsObject()
  @IsNotEmpty()
  $oid: string;
}

class SeriesDto {
  @ValidateNested()
  @Type(() => ObjectIdDto)
  @IsNotEmpty()
  seriesId: ObjectIdDto;

  @IsNumber()
  @IsNotEmpty()
  order: number;
}

class ComponentDto {
  @ValidateNested()
  @Type(() => ObjectIdDto)
  @IsNotEmpty()
  componentId: ObjectIdDto;

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