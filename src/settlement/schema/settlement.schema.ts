import * as mongoose from 'mongoose';
import { Document, Types } from 'mongoose';

export interface ISettlementModel extends Document {
  settlementId: string;
  providerId: string;
  provider: string;
  status: string;
  settlementStatus: string;
  paymentId: String | Types.ObjectId;
  amount: number;
  fee: number;
  taxAmount: number;
  currency: string;
  settlementDate?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  referenceId?: string;
  paymentReferenceNumber?: string;
  metadata?: {
    transaction: any;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export const SettlementSchema = new mongoose.Schema(
  {
    settlementId: {
      type: String
    },
    providerId: {
      type: String
    },
    provider: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    settlementStatus: {
      type: String,
      required: true,
    },
    paymentId: {
      type:String,
      ref: 'payment',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    fee: {
      type: Number,
      required: true,
    },
    taxAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    settlementDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
    },
    referenceId: {
      type: String,
    },
    paymentReferenceNumber: {
      type: String, // UTR
    },
    metadata: {
      transaction: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
  },
  {
    collection: 'settlement',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);
