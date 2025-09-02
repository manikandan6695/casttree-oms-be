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

  @IsOptional()
  mediaId?: string | ObjectIdDto;  // Support both string and ObjectId format

  @IsString()
  @IsOptional()
  mediaUrl?: string;
}

// ⭐ New DTO for Break-specific taskMetaData
export class BreakTaskMetaDataDto {
  @IsNumber()
  @IsNotEmpty()
  timeDurationInMin: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  @ArrayMinSize(1)
  media: MediaDto[];

  @IsString()
  @IsOptional()
  shareText?: string;
}

// Advertisement-specific DTO (existing)
export class AdvertisementTaskMetaDataDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  @ArrayMinSize(1)
  media: MediaDto[];

  @IsString()
  @IsOptional()
  shareText?: string;

  // Advertisement-specific fields
  @IsString()
  @IsOptional()
  redirectionUrl?: string;

  @IsString()
  @IsOptional()
  @IsIn(['Image', 'Video', 'Banner'])
  type?: string;

  @IsOptional()
  expertId?: string | ObjectIdDto;  // Support both string and ObjectId format

  @IsString()
  @IsOptional()
  ctaname?: string;
}

// Base TaskMetaData for video episodes (existing functionality)
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

// ⭐ Add Q&A metadata DTO
export class QATaskMetaDataDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  // text | audio | video (accept case-insensitive from samples)
  questionType: string;

  @IsString()
  @IsOptional()
  // Only for audio/video question types
  questionMediaUrl?: string;

  @IsString()
  @IsNotEmpty()
  // MCQ | Audio | Video | Upload | Text response
  responseFormat: string;

  @IsString()
  @IsOptional()
  // For Text response form
  response?: string;

  @IsArray()
  @IsOptional()
  options?: string[];

  @IsString()
  @IsOptional()
  correctAnswer?: string;

  @IsBoolean()
  @IsOptional()
  isSkippable?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  @ArrayMinSize(0)
  @IsOptional()
  media?: MediaDto[];

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
  @IsIn(['video', 'audio', 'text', 'quiz', 'assignment', 'advertisement', 'Break', 'Q&A'])
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

  // ⭐ Updated union type to include Break metadata
  @ValidateNested()
  @Type(() => TaskMetaDataDto, {
    discriminator: {
      property: 'type',
      subTypes: [
        { value: TaskMetaDataDto, name: 'video' },
        { value: TaskMetaDataDto, name: 'audio' },
        { value: TaskMetaDataDto, name: 'text' },
        { value: TaskMetaDataDto, name: 'quiz' },
        { value: TaskMetaDataDto, name: 'assignment' },
        { value: AdvertisementTaskMetaDataDto, name: 'advertisement' },
        { value: BreakTaskMetaDataDto, name: 'Break' },
        { value: QATaskMetaDataDto, name: 'Q&A' }
      ]
    },
    keepDiscriminatorProperty: false
  })
  taskMetaData: 
    | TaskMetaDataDto 
    | AdvertisementTaskMetaDataDto 
    | BreakTaskMetaDataDto
    | QATaskMetaDataDto;
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
