import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

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
  @IsString()
  feedbackStatus: string;

  @IsOptional()
  additionalDetail: AdditionalDetailDTO;
}
