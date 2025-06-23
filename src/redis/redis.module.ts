import { Module, forwardRef } from '@nestjs/common';
import { RedisService } from './redis.service';
import { PaymentRequestModule } from 'src/payment/payment-request.module';

@Module({
  imports: [forwardRef(() => PaymentRequestModule)],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}