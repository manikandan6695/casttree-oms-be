import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import {
  EServiceRequestMode,
  EServiceRequestStatus,
} from "../enum/service-request.enum";

export class FilterServiceRequestDTO {
  @IsOptional()
  @IsEnum(EServiceRequestStatus)
  requestStatus?: string;

  @IsNotEmpty()
  @IsEnum(EServiceRequestMode)
  mode: EServiceRequestMode;

  @IsOptional()
  @IsArray()
  nominationIds?: string[];
}
