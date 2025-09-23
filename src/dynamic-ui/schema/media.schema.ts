import mongoose from "mongoose";

// Define description interface for media description array
interface IMediaDescription {
  status: string;
  _id?: mongoose.Types.ObjectId;
  created_at?: Date;
  updated_at?: Date;
}

export interface mediaModel {
  created_by: mongoose.Types.ObjectId;
  media_type: string;
  media_size: string;
  media_url: string;
  privacy: string;
  tag: string[];
  description: IMediaDescription[];
  location: string;
  file_name: string;
  status: string;
  created_at?: Date;
  updated_at?: Date;
}

// Define description schema
const MediaDescriptionSchema = new mongoose.Schema<IMediaDescription>(
  {
    status: {
      type: String,
      required: true,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const mediaSchema = new mongoose.Schema<mediaModel>(
  {
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    media_type: {
      type: String,
      required: true,
      enum: ["video", "audio", "image", "document"],
    },
    media_size: {
      type: String,
      required: true,
    },
    media_url: {
      type: String,
      required: true,
    },
    privacy: {
      type: String,
      required: true,
      enum: ["public", "private", "protected"],
      default: "protected",
    },
    tag: [
      {
        type: String,
      },
    ],
    description: [MediaDescriptionSchema],
    location: {
      type: String,
      required: true,
    },
    file_name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    collection: "media",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
