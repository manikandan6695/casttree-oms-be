import * as mongoose from 'mongoose';
import { ECoinStatus } from 'src/payment/enum/payment.enum';

export interface IEventOutBox extends mongoose.Document {
    userId: any;
    eventName: string;
    payload: any;
    status: ECoinStatus;
    createdAt: Date;
    updatedAt: Date;
    documentStatus: ECoinStatus;
    triggeredAt: Date;
    sourceId: any;
    sourceType: string;
    consumer: string;
}

export const EventOutBoxSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    eventName: {
        type: String,
        required: true,
    },
    payload: {
        type: Object,
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
    documentStatus: {
        type: String,
        required: true,
    },
    triggeredAt: {  
        type: Date,
        default: Date.now,
    },
    sourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    sourceType: {
        type: String,
    },  
    consumer: {
        type: String,
    },
},  {
    collection: 'eventOutBox',
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  });

