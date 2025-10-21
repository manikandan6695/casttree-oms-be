import { 
  IsArray, 
  IsString, 
  IsOptional, 
  IsNotEmpty,
  IsBoolean,
  ArrayMinSize,
  IsMongoId
} from 'class-validator';

// Move ProItemDto before AddNewSeriesDto
export class ProItemDto {
  @IsMongoId()
  @IsNotEmpty()
  _id: string;

  @IsNotEmpty()
  @IsString()
  itemName: string;

  @IsNotEmpty()
  price: number;
}

export class MediaDto {
  @IsString()
  type: string;

  @IsString()
  mediaId: string;

  @IsString()
  mediaUrl: string;
}

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

  @IsNotEmpty()
  proItem: ProItemDto;

  @IsArray()
  @IsNotEmpty()
  paywallVideo: MediaDto[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  premiumThumbnails: string[];

  @IsString()
  @IsNotEmpty()
  skipText: string;
}