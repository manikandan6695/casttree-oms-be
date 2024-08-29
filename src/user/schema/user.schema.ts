import * as mongoose from "mongoose";
import { Schema } from "mongoose";
import { ESStatus, EStatus } from "src/shared/enum/privacy.enum";

export interface IUserModel extends mongoose.Document {
  phoneCountryCode: string;
  phoneNumber: string;
  emailId: string;
  userName: string;
  gender: string;
  dateOfBirth: Date;
  city: string;
  state: string;
  country: string;
  password: string;
  is_verified: boolean;
  tags: any;
  system_tags: any;
  status?: EStatus;
  created_at: Date;
  updated_at: Date;
}
export const MediaSchema = new mongoose.Schema({
  type: {
    type: String,
    description: "Types of the media",
  },
  visibility: {
    type: String,
    description: "Privacy settings of email",
    default: "Public",
  }, //public, private, mutual
  media_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "media",
  },
});
export const UserSchema = new mongoose.Schema(
  {
    phoneCountryCode: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    emailId: {
      type: String,
    },
    userName: {
      type: String,
    },
    gender: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
    },
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "city",
      description: "city of the user",
    },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "state",
      description: "state of the user",
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "country",
      description: "state of the user",
    },
    status: { type: String, enum: ESStatus, default: EStatus.Active },
    is_verified: {
      type: Boolean,
      default: false,
    },
    password: { type: String },
  },
  {
    autoIndex: true,
    collection: "user",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
