import {
IsOptional,
} from "class-validator";
export class FilterItemRequestDTO {
    @IsOptional()

    skill?: string;
  
    @IsOptional()
 
    "language.languageCode"?: string;
  
   
  }