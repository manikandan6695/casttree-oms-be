import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class GetStateDTO {
  // @IsOptional()
  // @IsMongoId()
  // country?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsNotEmpty()
  @IsNumber()
  skip: number;

  @IsNotEmpty()
  @IsNumber()
  limit: number;
}
