import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class customQuestionsDTO {
  @IsOptional()
  @IsString()
  question: string;
}
export class ProjectDTO {
  @IsOptional()
  @IsMongoId()
  projectId: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsMongoId()
  mediaId: string;

  @IsOptional()
  @IsString()
  mediaUrl: string;

  @IsOptional()
  @IsString()
  fileName: string;

  @IsOptional()
  @IsArray()
  customQuestions: customQuestionsDTO[];
}
export class AddServiceRequestDTO {
  @IsOptional()
  @IsMongoId()
  requestedToOrg: string;

  @IsOptional()
  @IsMongoId()
  requestedToUser: string;

  @IsOptional()
  @IsMongoId()
  requestedByOrg: string;

  @IsOptional()
  projectId: ProjectDTO;

  @IsOptional()
  customQuestions: customQuestionsDTO;

  @IsOptional()
  @IsString()
  requestId: string;

  @IsOptional()
  @IsString()
  itemId: string;
}