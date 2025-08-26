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
  mediaId?: string | ObjectIdDto;  // ⭐ Support both string and ObjectId format

  @IsString()
  @IsOptional()
  mediaUrl?: string;
}

// ⭐ New DTO for advertisement-specific taskMetaData
export class AdvertisementTaskMetaDataDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  @ArrayMinSize(1)
  media: MediaDto[];

  @IsString()
  @IsOptional()
  shareText?: string;

  // ⭐ Advertisement-specific fields
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

// ⭐ Base TaskMetaData for video episodes (existing functionality)
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
  @IsIn(['video', 'audio', 'text', 'quiz', 'assignment', 'advertisement'])  // ⭐ Add advertisement type
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

  // ⭐ Use union type to support both video and advertisement metadata
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
        { value: AdvertisementTaskMetaDataDto, name: 'advertisement' }
      ]
    },
    keepDiscriminatorProperty: false
  })
  taskMetaData: TaskMetaDataDto | AdvertisementTaskMetaDataDto;
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
