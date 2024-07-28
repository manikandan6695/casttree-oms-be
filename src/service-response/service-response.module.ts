import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "src/auth/auth.module";
import { SharedModule } from "src/shared/shared.module";
import { HelperModule } from "src/helper/helper.module";
import { ServiceResponseController } from "./service-response.controller";
import { ServiceResponseService } from "./service-response.service";
import { serviceResponseSchema } from "./schema/service-response.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "serviceResponse", schema: serviceResponseSchema },
    ]),
    SharedModule,
    AuthModule,
    HttpModule,
    HelperModule,
  ],
  controllers: [ServiceResponseController],
  providers: [ServiceResponseService],
})
export class ServiceResponseModule {}
