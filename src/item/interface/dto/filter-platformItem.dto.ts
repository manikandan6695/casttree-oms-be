import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
export class FilterPlatformItemDTO {
  @IsOptional()
  @IsString()
  itemName?: string;
}
export class processIdListDTO {
  @IsNotEmpty()
  @IsArray()
  processId?: string[];

  @IsOptional()
  @IsMongoId()
  userId?: string;
}
