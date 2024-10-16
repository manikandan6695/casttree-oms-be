import {
  IsNotEmpty, IsOptional,
  IsString
} from "class-validator";
export class FilterItemRequestDTO {
  @IsNotEmpty()

  skillId: string | string[];

  @IsOptional()
  languageId?: string | string[];


}