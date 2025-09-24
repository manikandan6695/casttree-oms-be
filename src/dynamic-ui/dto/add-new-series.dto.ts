import { 
  IsArray, 
  IsString, 
  IsOptional, 
  IsNotEmpty,
  IsBoolean,
  ArrayMinSize
} from 'class-validator';

export class AddNewSeriesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  category: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  proficiency: string[];

  @IsString()
  @IsNotEmpty()
  seriesName: string;

  @IsString()
  @IsNotEmpty()
  itemDescription: string;

  @IsString()
  thumbnail: string;

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

  @IsArray()
  @IsString({ each: true })
  languages: string[];

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