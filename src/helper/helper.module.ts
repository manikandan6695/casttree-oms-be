import { MongooseModule } from "@nestjs/mongoose";
import { forwardRef, Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";
import { HttpModule } from "@nestjs/axios";
import { HelperController } from "./helper.controller";
import { HelperService } from "./helper.service";
import { GetUserOriginMiddleware } from "./middleware/get-user-origin.middleware";

@Module({
  imports: [
    MongooseModule.forFeature([]),
    forwardRef(() => AuthModule),
    HttpModule,
  ],
  controllers: [HelperController],
  providers: [HelperService, GetUserOriginMiddleware],
  exports: [HelperService, GetUserOriginMiddleware],
})
export class HelperModule {}
