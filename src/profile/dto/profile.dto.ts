import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { RefMediaDTO } from "src/project/dto/project.dto";
import { EProfileVisibility } from "../enum/profile.enum";

export class AddProfileDTO {
  @IsNotEmpty()
  @IsMongoId()
  userId: string;

  @IsNotEmpty()
  @IsArray()
  roles: string[];

  @IsNotEmpty()
  @IsArray()
  skills: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RefMediaDTO)
  media: RefMediaDTO[];
}

export class LanguageDTO {
  @IsOptional()
  @IsString()
  languageName: string;

  @IsOptional()
  @IsString()
  languageId: string;

  @IsOptional()
  @IsArray()
  ability: string[];
}

export class EducationDTO {
  @IsOptional()
  @IsString()
  school: string;

  @IsOptional()
  @IsString()
  degree: string;

  @IsOptional()
  @IsString()
  fieldOfStudy: string;

  @IsOptional()
  @IsISO8601()
  startDate: Date;

  @IsOptional()
  @IsISO8601()
  endDate: Date;

  @IsOptional()
  @IsString()
  description: string;
}

export class WorkExperienceDTO {
  @IsOptional()
  @IsString()
  roleTitle: string;

  @IsOptional()
  @IsString()
  employmentType: string;

  @IsOptional()
  @IsString()
  companyName: string;

  @IsOptional()
  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  startDate: Date;

  @IsOptional()
  @IsString()
  endDate: Date;

  @IsOptional()
  @IsString()
  roleDescription: string;

  @IsOptional()
  @IsBoolean()
  isCurrentWork: boolean;
}

export class CrewDTO {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsMongoId()
  role: string;

  @IsOptional()
  @IsString()
  roleDescription: string;
}

export class FilterProfileDTO {
  @IsNotEmpty()
  @IsNumber()
  skip: number;

  @IsNotEmpty()
  @IsNumber()
  limit: number;

  @IsOptional()
  @IsMongoId()
  city: string;

  @IsOptional()
  @IsArray()
  skills: string[];

  @IsOptional()
  @IsArray()
  userIds: string[];
}
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
  @ValidateNested({ each: true })
  @Type(() => RefMediaDTO)
  media: RefMediaDTO[];

  @IsNotEmpty()
  @IsISO8601()
  completionDate: Date;

  @IsOptional()
  @IsString()
  recognition: string;

  @IsOptional()
  @IsString()
  selfRole: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrewDTO)
  crew: CrewDTO[];
}

export class ProfileListDTO {
  @IsOptional()
  @IsString()
  search: string;

  @IsOptional()
  @IsArray()
  userIds: string[];
}

export class ValidateUserNameDTO {
  @IsNotEmpty()
  @IsString()
  userName: string;
}

export class EndorsementDTO {
  @IsOptional()
  @IsMongoId()
  endorsedBy: string;

  @IsOptional()
  @IsMongoId()
  endorsementId: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsMongoId()
  relationship: string;

  @IsOptional()
  @IsMongoId()
  endorseTo: string;
}

export class SocialMediaDTO {
  @IsOptional()
  @IsString()
  platform: string;

  @IsOptional()
  @IsString()
  link: string;

  @IsOptional()
  @IsString()
  description: string;
}
export class AwardsDTO {
  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  issuerName: string;

  @IsOptional()
  @IsISO8601()
  issueDate: Date;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  url: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RefMediaDTO)
  media: RefMediaDTO[];

  // @IsOptional()
  // @IsMongoId()
  // projectId: string;
}

export class UpdateProfileDTO {
  @IsNotEmpty()
  @IsArray()
  roles: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AwardsDTO)
  awards: AwardsDTO;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RefMediaDTO)
  coverImage: RefMediaDTO[];

  @IsOptional()
  @IsString()
  gender: string;

  @IsOptional()
  @IsISO8601()
  dob: Date;

  @IsOptional()
  @IsString()
  userName: string;

  @IsNotEmpty()
  @IsArray()
  skills: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RefMediaDTO)
  media: RefMediaDTO[];

  @IsOptional()
  @IsString()
  about: string;

  @IsOptional()
  @IsString()
  @IsEnum(EProfileVisibility)
  visibility: EProfileVisibility;

  @IsOptional()
  @IsArray()
  language: LanguageDTO[];

  @IsOptional()
  @IsArray()
  education: EducationDTO[];

  @IsOptional()
  @IsArray()
  project: ProjectDTO[];

  @IsOptional()
  @IsArray()
  endorsement: EndorsementDTO[];

  @IsOptional()
  @IsArray()
  socialMedia: SocialMediaDTO[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RefMediaDTO)
  documents: RefMediaDTO[];

  @IsOptional()
  @IsArray()
  workExperience: WorkExperienceDTO[];
}
