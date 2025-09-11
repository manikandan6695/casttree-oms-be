import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsMongoId,
  ValidateNested,
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
  seriesId: string;
}
