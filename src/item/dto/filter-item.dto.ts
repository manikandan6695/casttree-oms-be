import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { EserviceItemType } from "../enum/serviceItem.type.enum";
import { EworkshopMode } from "../enum/workshopMode.enum";
export class FilterItemRequestDTO {
  @IsOptional()
  skillId: string | string[];

  @IsOptional()
  languageId?: string | string[];

  @IsOptional()
  @IsEnum(EserviceItemType)
  type: EserviceItemType;
}

export class TagDTO {
  @IsString()
  @IsNotEmpty()
  tagId: string;
}
export class FilterServiceItemDTO {
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TagDTO)
  tag: TagDTO[];
}
