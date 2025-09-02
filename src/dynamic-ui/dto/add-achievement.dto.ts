import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsMongoId,
  ValidateNested,
  IsIn
} from 'class-validator';
import { Type } from 'class-transformer';

export class ImageDto {
  @IsMongoId()
  @IsNotEmpty()
  mediaId: string;

  @IsString()
  @IsNotEmpty()
  mediaUrl: string;
}

export class AddAchievementDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ImageDto)
  image?: ImageDto;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsString()
  @IsNotEmpty()
  shareText: string;

  @IsMongoId()
  @IsNotEmpty()
  sectionId: string;

  @IsString()
  @IsNotEmpty()
  sectionName: string;

  @IsMongoId()
  @IsNotEmpty()
  seriesId: string;

  @IsString()
  @IsNotEmpty()
  seriesName: string;

  @IsString()
  @IsIn(['active', 'inactive'])
  status: string;
}
