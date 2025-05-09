import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { ETaxType } from "../enum/tax.enum";

export class AssociateTaxDTO {
  @IsNotEmpty()
  @IsNumber()
  skip: number;

  @IsNotEmpty()
  @IsNumber()
  limit: number;

  @IsNotEmpty()
  @IsString()
  type: ETaxType;
}
