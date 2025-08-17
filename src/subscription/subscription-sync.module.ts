import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SubscriptionSyncService } from "./subscription-sync.service";
import { SubscriptionSyncController } from "./subscription-sync.controller";
import { SubscriptionSyncEntity } from "./subscription-sync.entity";
import { subscriptionSchema } from "./schema/subscription.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "subscription", schema: subscriptionSchema }
    ]),
    TypeOrmModule.forFeature([SubscriptionSyncEntity])
  ],
  controllers: [SubscriptionSyncController],
  providers: [SubscriptionSyncService],
  exports: [SubscriptionSyncService]
})
export class SubscriptionSyncModule {}
