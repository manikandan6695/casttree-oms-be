import { IsOptional, IsString } from "class-validator";

export class CommentsDTO {
  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsString()
  sourceType?: string;

  @IsOptional()
  @IsString()
  commentDescription?: string;
}
