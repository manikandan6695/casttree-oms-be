import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";
import { SubscriptionRedisSyncService } from "./subscription-redis-sync.service";
import { SubscriptionRedisSyncController } from "./subscription-redis-sync.controller";
import { subscriptionSchema } from "./schema/subscription.schema";
import { RedisQueueService } from "../redis/redis-queue.service";
import { sqlPoolProvider } from "./sql/sql.provider";

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: "subscription", schema: subscriptionSchema }
    ])
  ],
  controllers: [SubscriptionRedisSyncController],
  providers: [
    SubscriptionRedisSyncService,
    RedisQueueService,
    sqlPoolProvider
  ],
  exports: [SubscriptionRedisSyncService]
})
export class SubscriptionSyncModule {}
