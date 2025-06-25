import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventOutBoxService } from './event-outbox.service';
import { EventOutBoxSchema } from './schema/event-outbox.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'eventOutBox', schema: EventOutBoxSchema },
    ]),
  ],
  providers: [EventOutBoxService],
  exports: [EventOutBoxService],
})
export class EventOutBoxModule {} 