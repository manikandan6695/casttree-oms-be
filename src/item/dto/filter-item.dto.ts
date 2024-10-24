import {
  IsEnum,
  IsNotEmpty, IsOptional,
  IsString
} from "class-validator";
import { EserviceItemType } from "../enum/serviceItem.type.enum";
import { EworkshopMode } from "../enum/workshopMode.enum";
export class FilterItemRequestDTO {
  @IsNotEmpty()

  skillId: string | string[];

  @IsOptional()
  languageId?: string | string[];

  @IsOptional()
  @IsEnum(EserviceItemType)
  type: EserviceItemType;

  @IsOptional()
  @IsEnum(EworkshopMode)
  mode: EworkshopMode;

  @IsOptional()
  @IsString()
  displayName: string;




}