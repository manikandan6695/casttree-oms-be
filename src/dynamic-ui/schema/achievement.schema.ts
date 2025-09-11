import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

export type AchievementDocument = Achievement & Document;

@Schema({ collection: "achievement" })
export class Achievement {
  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  type: string;

  @Prop({
    type: {
      shareOptions: {
        text: { type: String, required: true },
      },
      templateUrl: { type: String, required: true },
      textColor: { type: String, required: true },
    },
    required: true,
  })
  metaData: {
    shareOptions: {
      text: string;
    };
    templateUrl: string;
    textColor: string;
  };

  @Prop({ required: true, enum: ["Active", "Inactive"] })
  status: string;

  @Prop({ required: true })
  sourceId: string;

  @Prop({ required: true })
  sourceType: string;

  @Prop({ required: true, default: true })
  visibilityStatus: boolean;

  @Prop({ required: true, default: "casttree" })
  provider: string;

  @Prop({ required: true, default: 1 })
  version: number;

  @Prop({ required: true, default: "string" })
  description: string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId })
  updatedBy: MongooseSchema.Types.ObjectId;
}

export const AchievementSchema = SchemaFactory.createForClass(Achievement);

// Indexes for achievement lookups/filters
AchievementSchema.index({ key: 1 }, { unique: true });
AchievementSchema.index({ status: 1 });
AchievementSchema.index({ sourceId: 1, sourceType: 1 });