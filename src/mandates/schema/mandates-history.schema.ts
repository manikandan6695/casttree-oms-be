import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

export type MandateHistoryDocument = MandateHistory & Document;

@Schema({ timestamps: true })
export class MandateHistory {
  @Prop({ required: true, index: true })
  mandateId: string; // Reference to the mandate

  @Prop({ required: true, enum: ["Pending", "Active", "Failed", "Cancelled"] })
  mandateStatus: string; // Latest status

  @Prop()
  status: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User" })
  createdBy: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User" })
  updatedBy: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const MandateHistorySchema =
  SchemaFactory.createForClass(MandateHistory);
