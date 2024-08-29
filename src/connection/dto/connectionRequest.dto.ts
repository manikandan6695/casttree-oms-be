import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { ESConnectionStatus } from "../enum/connection.enum";

export class ConnectionRequestDTO {
  @IsNotEmpty()
  @IsMongoId()
  receiverProfileId: string;

  @IsNotEmpty()
  @IsString()
  type: string;
}

export class UpdateConnectionDTO {
  @IsNotEmpty()
  @IsString()
  requestStatus: string;

  @IsNotEmpty()
  @IsMongoId()
  receiverProfileId: string;

  @IsNotEmpty()
  @IsMongoId()
  requestId: string;

  @IsNotEmpty()
  @IsString()
  type: string;
}

export class ConnectionDTO {
  @IsNotEmpty()
  @IsEnum(ESConnectionStatus)
  connectionStatus: any;
}
