import {
  IsString,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  ValidateNested,
  IsUrl,
} from "class-validator";
import { Type } from "class-transformer";

class NominationTagDto {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  categoryName: string;

  @IsString()
  @IsNotEmpty()
  iconName: string;

  @IsString()
  @IsNotEmpty()
  categoryType: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  iconMediaUrl: string;
}

export class UpdateNomineeTagDto {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  nomineeId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NominationTagDto)
  @IsNotEmpty()
  tags: NominationTagDto[];
}
