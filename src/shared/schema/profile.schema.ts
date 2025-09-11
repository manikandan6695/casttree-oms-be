import mongoose from "mongoose";

export interface IProfile {
  userId: mongoose.Types.ObjectId;
  roles: mongoose.Types.ObjectId[];
  skills: mongoose.Types.ObjectId[];
  media: Array<{
    type: string;
    visibility: string;
    media_id: mongoose.Types.ObjectId;
    _id: mongoose.Types.ObjectId;
  }>;
  visibility: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  coverImage: Array<{
    type: string;
    visibility: string;
    media_id: mongoose.Types.ObjectId;
    _id: mongoose.Types.ObjectId;
  }>;
  language: any[];
  education: any[];
  workExperience: any[];
  documents: any[];
  awards: any[];
  socialMedia: mongoose.Types.ObjectId[];
  dob: Date;
  about: string;
  userName: string;
  displayName: string;
  objectives: Array<{
    category_id: mongoose.Types.ObjectId;
    _id: mongoose.Types.ObjectId;
  }>;
  type: string;
  created_at: Date;
  updated_at: Date;
}

export interface IProfileModel extends IProfile, mongoose.Document {}

export const ProfileSchema = new mongoose.Schema<IProfileModel>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "role"
  }],
  skills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "skill"
  }],
  media: [{
    type: {
      type: String,
      enum: ["display_picture", "cover_picture", "other"]
    },
    visibility: {
      type: String,
      enum: ["Public", "Private", "Friends"]
    },
    media_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "media"
    }
  }],
  visibility: {
    type: String,
    enum: ["Public", "Private", "Friends"],
    default: "Public"
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  coverImage: [{
    type: {
      type: String,
      enum: ["display_picture", "cover_picture", "other"]
    },
    visibility: {
      type: String,
      enum: ["Public", "Private", "Friends"]
    },
    media_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "media"
    }
  }],
  language: [mongoose.Schema.Types.Mixed],
  education: [mongoose.Schema.Types.Mixed],
  workExperience: [mongoose.Schema.Types.Mixed],
  documents: [mongoose.Schema.Types.Mixed],
  awards: [mongoose.Schema.Types.Mixed],
  socialMedia: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "socialMedia"
  }],
  dob: Date,
  about: String,
  userName: String,
  displayName: String,
  objectives: [{
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category"
    }
  }],
  type: {
    type: String,
    enum: ["Expert", "Learner", "Admin"],
    default: "Learner"
  }
}, {
  collection: "profile",
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
});
