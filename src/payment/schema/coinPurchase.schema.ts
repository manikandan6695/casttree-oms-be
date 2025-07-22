import * as mongoose from 'mongoose';
import { ECoinStatus, ESCoinStatus, ETransactionType, ETransactionTypes } from '../enum/payment.enum';

export interface ICoinTransaction extends mongoose.Document {
    userId: any;
    senderId: any;
    receiverId: any;
    type: ETransactionType;
    transactionType: ETransactionType;
    currentBalance: number;
    documentStatus: ECoinStatus;
    sourceType: string;
    sourceId: any;
    transactionDate: Date;
    status: ECoinStatus;
    coinValue: number;
    createdAt: Date;
    updatedAt: Date;
  }
  
export const CoinTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    type: {
      type: String,
      enum: ETransactionType,
      required: true,
    },
    transactionType: {
      type: String,
      enum: ETransactionType,
      required: true,
    },
    currentBalance: {
      type: Number,
      required: true,
    },
    sourceType: {
      type: String,
      required: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    documentStatus: {
      type: String,
      enum: ESCoinStatus,
      required: true,
    },
    transactionDate: {
      type: Date,
      default: () => new Date(),
    },
    status: {
      type: String,
      enum: ESCoinStatus,
      default: ECoinStatus.active,
    },
    coinValue: {
      type: Number,
      required: true,
    },
  },
  {
    collection: 'coinTransaction',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);
