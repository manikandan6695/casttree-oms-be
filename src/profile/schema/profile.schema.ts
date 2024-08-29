import * as mongoose from "mongoose";
import { IMedia, IMediaModel } from "src/media/schema/media.schema";
import { IUserModel, MediaSchema } from "src/user/schema/user.schema";
export interface IEducationModel {
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate: Date;
  description: string;
  media: IMedia[];
}
export interface IWorkExperienceModel {
  roleTitle: string;
  employmentType: string;
  companyName: string;
  location: string;
  startDate: Date;
  endDate: Date;
  isCurrentWork: boolean;
  roleDescription: string;
  media: IMedia[];
}
export interface ILanguageModel {
  languageName: string;
  languageId: string;
  ability: string[];
}

export interface ISocialMediaModel {
  socialMediaType: string;
  socialMediaLink: string;
  description: string;
}
export interface IAwardModel {
  title: string;
  issuerName: string;
  issueDate: Date;
  description: string;
  url: string;
  media: IMedia[];
  // projectId?: string;
}
export interface IProfileModel extends mongoose.Document {
  userId: string | IUserModel;
  roles: string[];
  skills: string[];
  media: IMedia[];
  about: string;
  gender: string;
  dob: string;
  awards: any;
  visibility: string;
  coverImage: string;
  userName: string;
  documents: IMedia[];
  language: ILanguageModel[];
  education: IEducationModel[];
  socialMedia: ISocialMediaModel[];
  workExperience: IWorkExperienceModel[];
  createdBy: string | IUserModel;
  updatedBy: string | IUserModel;
}

export const languageSchema = new mongoose.Schema<any>({
  languageName: {
    type: String,
  },
  languageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "language",
  },
  ability: [
    {
      type: String,
    },
  ],
});

export const workExperienceSchema = new mongoose.Schema<any>({
  roleTitle: {
    type: String,
  },
  employmentType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
  },
  companyName: {
    type: String,
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "city",
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  isCurrentWork: {
    type: Boolean,
  },
  roleDescription: {
    type: String,
  },
  media: [MediaSchema],
});
export const educationSchema = new mongoose.Schema<any>({
  school: {
    type: String,
  },
  degree: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
  },
  fieldOfStudy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  description: {
    type: String,
  },
  media: [MediaSchema],
});

export const awardSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  issuerName: {
    type: String,
  },
  issueDate: {
    type: Date,
  },
  description: {
    type: String,
  },
  url: {
    type: String,
  },
  media: [MediaSchema],
});

export const socialMediaSchema = new mongoose.Schema<any>({
  platform: {
    type: String,
  },
  link: {
    type: String,
  },
  description: {
    type: String,
  },
});

export const profileSchema = new mongoose.Schema<any>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    about: {
      type: String,
    },
    userName: {
      type: String,
    },
    coverImage: [MediaSchema],
    dob: {
      type: Date,
    },
    language: [languageSchema],
    education: [educationSchema],
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
      },
    ],
    workExperience: [workExperienceSchema],
    skills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "skills",
      },
    ],
    documents: [MediaSchema],
    media: [MediaSchema],
    awards: [awardSchema],
    socialMedia: [socialMediaSchema],
    visibility: {
      type: String,
      default: "Public",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    collection: "profile",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
