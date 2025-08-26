import { 
  IsArray, 
  IsString, 
  IsNumber, 
  IsBoolean, 
  IsOptional, 
  IsObject,
  IsMongoId,
  ValidateNested,
  ArrayMinSize,
  IsIn,
  IsNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';

export class MediaDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['thumbNail', 'story', 'video', 'audio', 'image'])
  type: string;

  @IsString()
  @IsOptional()
  mediaId?: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;
}

export class TaskMetaDataDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  @ArrayMinSize(1)
  media: MediaDto[];

  @IsString()
  @IsOptional()
  shareText?: string;
}

export class ObjectIdDto {
  @IsString()
  @IsNotEmpty()
  $oid: string;
}

export class EpisodeDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ObjectIdDto)
  _id?: ObjectIdDto;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['video', 'audio', 'text', 'quiz', 'assignment'])
  type: string;

  @IsBoolean()
  isLocked: boolean;

  @IsNumber()
  taskNumber: number;

  @IsString()
  @IsNotEmpty()
  parentProcessId: string;

  @IsString()
  @IsNotEmpty()
  processId: string;

  @ValidateNested()
  @Type(() => TaskMetaDataDto)
  taskMetaData: TaskMetaDataDto;
}

export class AddNewEpisodesDto {
  @IsString()
  @IsNotEmpty()
  seriesId: string;

  @IsString()
  @IsNotEmpty()
  seriesTitle: string;

  @IsNumber()
  episodeCount: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EpisodeDto)
  @ArrayMinSize(1)
  episodes: EpisodeDto[];
}
