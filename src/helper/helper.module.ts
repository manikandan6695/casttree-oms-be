import { MongooseModule } from "@nestjs/mongoose";
import { Module } from "@nestjs/common";
import { SharedModule } from "src/shared/shared.module";
import { AuthModule } from "src/auth/auth.module";
import { HttpModule } from "@nestjs/axios";
import { HelperController } from "./helper.controller";
import { HelperService } from "./helper.service";

@Module({
  imports: [
    MongooseModule.forFeature([]),
    SharedModule,
    AuthModule,
    HttpModule,
  ],
  controllers: [HelperController],
  providers: [HelperService],
  exports: [HelperService],
})
export class HelperModule {}
