import { MongooseModule } from "@nestjs/mongoose";
import { Module } from "@nestjs/common";
import { CtApiController } from "./ct-api.controller";
import { CtApiService } from "./ct-api.service";
import { SharedModule } from "src/shared/shared.module";
import { AuthModule } from "src/auth/auth.module";
import { HttpModule } from "@nestjs/axios";
import { UserSchema } from "src/user/schema/user.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ schema: UserSchema, name: "user" }]),
    SharedModule,
    AuthModule,
    HttpModule,
  ],
  controllers: [CtApiController],
  providers: [CtApiService],
  exports: [CtApiService],
})
export class CtApiModule {}
