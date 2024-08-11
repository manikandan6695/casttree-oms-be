import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from "class-validator";
import { EServiceRequestStatus } from "../enum/service-request.enum";

export class FilterServiceRequestDTO {
  @IsOptional()
  @IsEnum(EServiceRequestStatus)
  requestStatus?: string;

  @IsOptional()
  @IsMongoId()
  requestedToUser: string;

  @IsOptional()
  @IsMongoId()
  requestedToOrg: string;

  @IsOptional()
  @IsArray()
  nominationIds?: string[];
}
