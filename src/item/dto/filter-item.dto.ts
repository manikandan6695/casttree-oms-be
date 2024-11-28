import {
  IsEnum,
  IsNotEmpty, IsOptional,
  IsString
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