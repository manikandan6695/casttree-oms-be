import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "src/auth/auth.module";
import { HelperModule } from "src/helper/helper.module";
import { SharedModule } from "src/shared/shared.module";
import { serviceResponseFormatSchema } from "./schema/serviceResponseFormat.schema";
import { ServiceResponseFormatController } from "./service-response-format.controller";
import { ServiceResponseFormatService } from "./service-response-format.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "serviceResponseFormat", schema: serviceResponseFormatSchema },
    ]),
    SharedModule,
    AuthModule,
    HttpModule,
    HelperModule,
  ],
  controllers: [ServiceResponseFormatController],
  providers: [ServiceResponseFormatService],
})
export class ServiceResponseFormatModule {}
