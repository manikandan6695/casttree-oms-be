import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type VirtualItemDocument = VirtualItem & Document;

@Schema({
  timestamps: true,
  collection: "virtualItem", // Specify exact collection name
})
export class VirtualItem {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ["queries", "gift", "contest"] })
  type: string;

  @Prop({ type: [Object], default: [] })
  media: any[];

  @Prop({ required: true, default: false })
  isPayable: boolean;

  @Prop({ required: true })
  status: string;

  @Prop({ type: Types.ObjectId, ref: "PayableType" })
  payableType: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  comparePrice: number;

  @Prop({ type: Object, default: {} })
  additionalData: Record<string, any>;

  @Prop({ default: "" })
  description: string;

  @Prop({ default: "" })
  shortDescription: string;

  @Prop({ required: true, default: 0 })
  payableValue: number;

  @Prop({
    type: [
      {
        sourceId: { type: Types.ObjectId, required: true },
        sourceType: {
          type: String,
          required: true,
          enum: ["process", "series", "episode"],
        },
      },
    ],
    default: [],
  })
  source: Array<{
    sourceId: Types.ObjectId;
    sourceType: string;
  }>;

  @Prop({ default: "" })
  stickerSound: string;

  @Prop({ default: "" })
  stickerGif: string;
}

export const VirtualItemSchema = SchemaFactory.createForClass(VirtualItem);

// Indexes for virtual item queries
VirtualItemSchema.index({ type: 1 });
VirtualItemSchema.index({ status: 1 });
VirtualItemSchema.index({ isPayable: 1 });
VirtualItemSchema.index({ "source.sourceId": 1, "source.sourceType": 1 });
