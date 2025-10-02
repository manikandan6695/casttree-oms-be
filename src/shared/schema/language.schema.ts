import * as mongoose from "mongoose";

export const LanguageMediaSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  mediaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "media",
  }, //public, private, mutual
});

export interface ILanguageMedia {
  name: string;
  mediaId: string;
}
export interface ILanguage extends mongoose.Document {
  language_id: string;
  language_code: string;
  language_name: string;
  language_native_name: string;
  media: ILanguageMedia[];
}

export const LanguageSchema = new mongoose.Schema(
  {
    language_id: { type: String },
    language_code: { type: String },
    language_name: { type: String },
    language_native_name: { type: String },
    media: [LanguageMediaSchema],
  },
  {
    collection: "language",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Indexes for name/code lookups
LanguageSchema.index({ language_name: 1 });
LanguageSchema.index({ language_code: 1 });
