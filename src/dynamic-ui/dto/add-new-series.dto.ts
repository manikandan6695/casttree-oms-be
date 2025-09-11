import { 
  IsArray, 
  IsString, 
  IsOptional, 
  IsNotEmpty,
  IsBoolean
} from 'class-validator';

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
