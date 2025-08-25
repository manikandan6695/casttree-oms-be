import { 
  IsArray, 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsObject, 
  IsMongoId,
  ValidateNested,
  ArrayMinSize,
  IsIn,
  IsEmpty,
  IsNotEmpty,
  IsBoolean
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class AddNewSeriesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  category: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  proficiency: string[];

  @IsString()
  @IsNotEmpty()
  seriesName: string;

  @IsString()
  @IsNotEmpty()
  itemDescription: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsString()
  @IsNotEmpty()
  episodeCount: string;

  @IsString()
  @IsNotEmpty()
  price: string;

  @IsString()
  @IsNotEmpty()
  comparePrice: string;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  expert: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsOptional()
  @IsBoolean()
  expertQueriesEnabled?: boolean;
}
