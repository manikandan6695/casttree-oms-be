import {
IsArray,
IsOptional,
IsString,
} from "class-validator";
export class FilterItemRequestDTO {
    @IsOptional()
    @IsString()
    skill?: string;
  
    @IsOptional()
    languageCode?: string;
  
   
  }