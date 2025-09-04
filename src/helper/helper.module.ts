import { MongooseModule } from "@nestjs/mongoose";
import { Module } from "@nestjs/common";
import { SharedModule } from "src/shared/shared.module";
import { AuthModule } from "src/auth/auth.module";
import { HttpModule } from "@nestjs/axios";
import { HelperController } from "./helper.controller";
import { HelperService } from "./helper.service";
import { GetUserOriginMiddleware } from "./middleware/get-user-origin.middleware";
import { RedisModule } from "src/redis/redis.module";

@Module({
  imports: [
    MongooseModule.forFeature([]),
    SharedModule,
    AuthModule,
    HttpModule,
    RedisModule,
  ],
  controllers: [HelperController],
  providers: [HelperService, GetUserOriginMiddleware],
  exports: [HelperService, GetUserOriginMiddleware],
})
export class HelperModule {}
