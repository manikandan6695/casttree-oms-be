import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { EServiceResponse } from "../enum/service-response.enum";

export class AdditionalDetailDTO {
  @IsOptional()
  @IsBoolean()
  isPassed: boolean;
}

export class ServiceResponseDTO {
  @IsOptional()
  @IsMongoId()
  responseId: string;

  @IsNotEmpty()
  @IsMongoId()
  itemId: string;

  @IsOptional()
  @IsMongoId()
  requestId: string;

  @IsNotEmpty()
  @IsArray()
  standardResponse: any;

  @IsNotEmpty()
  @IsArray()
  customQuestionResponse: any;

  @IsNotEmpty()
  @IsNumber()
  overAllRatings: number;

  @IsNotEmpty()
  @IsEnum(EServiceResponse)
  feedbackStatus: EServiceResponse;

  @IsOptional()
  additionalDetail: AdditionalDetailDTO;
}
