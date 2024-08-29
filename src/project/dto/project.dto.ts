import { Type } from "class-transformer";
import {
  IsArray,
  IsISO8601,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

export class ProjectDTO {
  @IsNotEmpty()
  @IsMongoId()
  category: string;

  @IsOptional()
  @IsMongoId()
  project_id: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsMongoId()
  language: string;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsNotEmpty()
  @IsString()
  documentStatus: string;

  @IsNotEmpty()
  @IsMongoId()
  genre: string;

  @IsOptional()
  @IsArray()
  media: any[];

  @IsNotEmpty()
  @IsISO8601()
  completionDate: Date;
}

export class RefMediaDTO {
  @IsOptional()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  @IsMongoId()
  media_id: string;

  @IsOptional()
  @IsString()
  visibility?: string;
}
