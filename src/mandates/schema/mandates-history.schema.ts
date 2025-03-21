import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type MandateHistoryDocument = MandateHistory & Document;

@Schema({ timestamps: true })
export class MandateHistory {
  @Prop({ required: true, index: true })
  mandateId: string; // Reference to the mandate

  @Prop({ required: true })
  provider: string; // e.g., "Cashfree" or "Razorpay"

  @Prop({ required: true, enum: ["Pending", "Active", "Failed", "Cancelled"] })
  status: string; // Latest status

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const MandateHistorySchema =
  SchemaFactory.createForClass(MandateHistory);
