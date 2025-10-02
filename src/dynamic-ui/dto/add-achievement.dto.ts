import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class ImageDto {
  @IsMongoId()
  @IsNotEmpty()
  mediaId: string;

  @IsString()
  @IsNotEmpty()
  mediaUrl: string;
}

export class AddAchievementDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ImageDto)
  image: ImageDto;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsString()
  @IsNotEmpty()
  shareText: string;

  @IsMongoId()
  @IsNotEmpty()
  processId: string;
}
