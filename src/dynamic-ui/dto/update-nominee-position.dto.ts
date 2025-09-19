import { Type } from "class-transformer";
import { IsString, IsNotEmpty, IsMongoId, IsNumber, IsArray, ValidateNested } from "class-validator";

class PositionDto {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  nomineeId: string;

  @IsNumber()
  @IsNotEmpty()
    position: number;
    
    @IsString()
    @IsNotEmpty()
    @IsMongoId()
    amount: string;
}

export class UpdateNomineePositionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PositionDto)
  @IsNotEmpty()
  positions: PositionDto[];
}