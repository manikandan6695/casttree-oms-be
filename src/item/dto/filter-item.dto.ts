import {
  IsEnum,
  IsNotEmpty, IsOptional,
  IsString
} from "class-validator";
import { EserviceItemType } from "../enum/serviceItem.type.enum";
export class FilterItemRequestDTO {
  @IsNotEmpty()

  skillId: string | string[];

  @IsOptional()
  languageId?: string | string[];

  @IsNotEmpty()
  @IsEnum(EserviceItemType)
  type: EserviceItemType;


}