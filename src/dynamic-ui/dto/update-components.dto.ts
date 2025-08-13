import { IsArray, ValidateNested, IsObject, IsNumber, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class ObjectIdDto {
  @IsObject()
  $oid: string;
}

class SeriesDto {
  @ValidateNested()
  @Type(() => ObjectIdDto)
  seriesId: ObjectIdDto;

  @IsNumber()
  order: number;
}

class ComponentDto {
  @ValidateNested()
  @Type(() => ObjectIdDto)
  componentId: ObjectIdDto;

  @IsNumber()
  order: number;

  @IsString()
  @IsOptional()
  tag: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeriesDto)
  series: SeriesDto[];
}

export class UpdateComponentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentDto)
  components: ComponentDto[];
}