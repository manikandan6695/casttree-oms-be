import { IMedia } from "src/media/schema/media.schema";
import * as mongoose from "mongoose";
import { MediaSchema } from "src/user/schema/user.schema";
import { ILanguage } from "src/shared/schema/language.schema";

export interface IMembersModel {
  userId: string;
  type: string;
  role: string;
  status: string;
}
export interface IProjectModel extends mongoose.Document {
  title: string;
  recognition: string;
  selfRole: string;
  category: string;
  language: ILanguage;
  description: string;
  documentStatus: string;
  genre: any;
  members: IMembersModel[];
  media: any[];
  completionDate: Date;
  submittedBy: string;
  status: string;
  createdBy: string;
  updatedBy: string;
}
export const MembersSchema = new mongoose.Schema<any>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  type: { type: String },
  role: { type: String },
  status: { type: String },
});
export const projectsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },
    recognition: {
      type: String,
    },
    selfRole: {
      type: String,
    },
    description: {
      type: String,
    },
    members: [MembersSchema],
    genre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "genre",
    },
    language: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "language",
    },
    media: [MediaSchema],
    completionDate: {
      type: String,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    documentStatus: {
      type: String,
    },
    status: {
      type: String,
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
    collection: "projects",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
