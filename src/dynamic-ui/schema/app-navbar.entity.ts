import mongoose from "mongoose";
export interface IMediaModel {
  mediaId: any;
  mediaUrl: string;
}
export interface IAppNavBar extends mongoose.Document {
  name: string;
  key: string;
  position: string;
  tabs: {
    name: string;
    icon: IMediaModel;
    bgImage: IMediaModel;
    bgColorCode: string;
    pageId: mongoose.Types.ObjectId;
  }[];
  orientation: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export const mediaSchema = new mongoose.Schema<any>({
  mediaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "media",
  },
  mediaUrl: { type: String },
});

export const AppNavBarSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    position: { type: String, required: true },
    tabs: [
      {
        name: { type: String, required: true },
        icon: mediaSchema,
        bgColorCode: { type: String },
        bgImage: mediaSchema,
        pageId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "contentPage",
          required: true,
        },
      },
    ],
    orientation: { type: String, required: true },
    status: {
      type: String,
      default: "Active",
    },
  },
  {
    collection: "appNavBar",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);
