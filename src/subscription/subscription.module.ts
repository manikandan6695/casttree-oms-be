import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { MongooseModule } from "@nestjs/mongoose";
import { SharedModule } from 'src/shared/shared.module';
import { AuthModule } from 'src/auth/auth.module';
import { subscriptionSchema } from './schema/subscription.schema';
import { CtApiModule } from 'src/ct-api/ct-api.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "subscription", schema: subscriptionSchema },
    ]),
    SharedModule,
    AuthModule,
    CtApiModule
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService]
})
export class SubscriptionModule {}
