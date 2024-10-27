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
import { EserviceItemType } from "src/item/enum/serviceItem.type.enum";

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

  @IsOptional()
  @IsEnum(EserviceItemType)
  type:EserviceItemType;
}
