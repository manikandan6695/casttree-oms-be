import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import {
  Document,
  Types,
  Schema as MongooseSchema,
  SchemaTypes,
} from "mongoose";

export type AwardDocument = Award & Document;

export enum AwardType {
  GROUP = "Group",
  // INDIVIDUAL = 'Individual', // add if needed
}

export enum AwardStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
}

@Schema({
  timestamps: true,
  collection: "awards",
})
export class Award {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: String, enum: Object.values(AwardType), required: true })
  awardType: AwardType;

  // Sample shows "499" as string; keep as string to match
  @Prop({ type: String, required: true })
  price: string;

  @Prop({ type: String, required: true })
  currency: string;

  // Arbitrary object
  @Prop({ type: SchemaTypes.Mixed, default: {} })
  tax: Record<string, any>;

  @Prop({
    type: [
      new MongooseSchema({
        type: { type: String, required: true }, // e.g., 'display_picture'
        media_id: { type: Types.ObjectId, ref: "Media", required: true },
      }),
    ],
    default: [],
  })
  media: Array<{
    type: string;
    media_id: Types.ObjectId;
  }>;

  @Prop({
    type: String,
    enum: Object.values(AwardStatus),
    default: AwardStatus.ACTIVE,
  })
  status: AwardStatus;

  @Prop({ type: Types.ObjectId, ref: "Category", required: true })
  category: Types.ObjectId;

  @Prop()
  subtitle: string;

  @Prop({ type: Types.ObjectId, ref: "Item", required: true })
  itemId: Types.ObjectId;

  @Prop()
  sequencePrefix: string;
}

export const AwardSchema = SchemaFactory.createForClass(Award);
