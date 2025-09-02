import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum QueryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending'
}

export class CreateQueryDto {
  @IsString()
  name: string;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  price: number;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  comparePrice: number;

  @IsString()
  sectionId: string;

  @IsString()
  sectionName: string;

  @IsString()
  seriesId: string;

  @IsString()
  seriesName: string;

  @IsEnum(QueryStatus)
  @IsOptional()
  status?: QueryStatus;
}

