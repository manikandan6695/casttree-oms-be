import * as mongoose from "mongoose";
import {
  ECommandProcessingStatus,
  ECommandType,
} from "../enum/command-source.enum";

export interface ICommandSourceModel extends mongoose.Document {
  userId?: string;
  resourceUri?: string;
  aggregateType?: string;
  aggregateId?: string;
  action?: string;
  type: ECommandType;
  commandData: any;
  isCompositeIndex: boolean;
  status: ECommandProcessingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const CommandSourceSchema = new mongoose.Schema<any>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    resourceUri: {
      type: String,
    },
    aggregateType: {
      type: String,
      required: false,
    },
    aggregateId: {
      type: String,
      required: false,
    },
    action: {
      type: String,
    },
    type: {
      type: String,
      required: true,
      default: ECommandType.Rest,
    },
    commandData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    isCompositeIndex: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ECommandProcessingStatus,
      default: null,
    },
  },
  {
    collection: "commandSource",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);
