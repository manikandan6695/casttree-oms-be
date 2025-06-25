import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IEventOutBox } from './schema/event-outbox.schema';
import { ECoinStatus } from 'src/payment/enum/payment.enum';
const { ObjectId } = require('mongodb');

@Injectable()
export class EventOutBoxService {
  constructor(
    @InjectModel('eventOutBox')
    private eventOutBoxModel: Model<IEventOutBox>,
  ) {}

  async createEventOutBox(payload: any) {
    return await this.eventOutBoxModel.create(payload);
  }

  async updateEventOutBox(payload: any) {
    try {
      const parsed = typeof payload?.element === 'string' ? JSON.parse(payload.element) : payload.element;
      const eventOutBoxId = parsed.eventOutBoxId;
      return await this.eventOutBoxModel.updateOne(
        {
          _id: new ObjectId(eventOutBoxId),
          status: ECoinStatus.active,
          userId: new ObjectId(parsed.payload?.userId),
          documentStatus: ECoinStatus.pending,
        },
        {
          $set: {
            documentStatus: ECoinStatus.completed,
            updatedAt: new Date(),
          },
        },
      );
    } catch (error) {
      throw error;
    }
  }
} 