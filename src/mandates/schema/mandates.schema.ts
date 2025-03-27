import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

export type MandateDocument = Mandate & Document;

@Schema({
  collection: "mandates",
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
})
export class Mandate {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  sourceId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  userId: string;

  @Prop({ required: true })
  paymentMethod: string;

  @Prop()
  upiVpa: string;

  @Prop()
  bankAccountNumber: string; // Store masked bank account

  @Prop()
  bankIFSC: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop()
  frequency: string;

  @Prop()
  mandateStatus: string;

  @Prop()
  status: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metaData: Record<string, any>;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop()
  cancelDate: Date;

  @Prop()
  cancelReason: string;

  @Prop()
  providerId: number;

  @Prop()
  planId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User" })
  createdBy: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User" })
  updatedBy: string;
}

export const MandateSchema = SchemaFactory.createForClass(Mandate);
