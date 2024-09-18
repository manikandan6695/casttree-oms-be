import {
  IsNotEmpty, IsOptional
} from "class-validator";
export class FilterItemRequestDTO {
  @IsNotEmpty()

  skill: string | string[];

  @IsOptional()
  languageCode?: string | string[];


}