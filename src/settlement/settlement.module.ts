import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettlementService } from './settlement.service';
import { SettlementController } from './settlement.controller';
import { SettlementSchema } from './schema/settlement.schema';
import { HelperModule } from '../helper/helper.module';
import { SharedModule } from '../shared/shared.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentSchema } from '../payment/schema/payment.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Settlement', schema: SettlementSchema },
      { name: 'payment', schema: PaymentSchema },
    ]),HelperModule, SharedModule,
        AuthModule,
  ],
  controllers: [SettlementController],
  providers: [SettlementService],
  exports: [SettlementService],
})
export class SettlementModule {}
