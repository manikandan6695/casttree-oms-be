import { Module, forwardRef } from '@nestjs/common';
import { RedisService } from './redis.service';
import { PaymentRequestModule } from 'src/payment/payment-request.module';
import { EventOutBoxSchema } from './schema/eventOutBox';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [forwardRef(() => PaymentRequestModule), MongooseModule.forFeature([{ name: 'eventOutBox', schema: EventOutBoxSchema }])],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}