import { Module, forwardRef } from '@nestjs/common';
import { RedisService } from './redis.service';
import { PaymentRequestModule } from 'src/payment/payment-request.module';
import { MongooseModule } from '@nestjs/mongoose';
import { EventOutBoxModule } from '../event-outbox/event-outbox.module';
import { EventOutBoxSchema } from '../event-outbox/schema/event-outbox.schema';

@Module({
  imports: [
    forwardRef(() => PaymentRequestModule),
    MongooseModule.forFeature([{ name: 'eventOutBox', schema: EventOutBoxSchema }]),
    EventOutBoxModule,
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}