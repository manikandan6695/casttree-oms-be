import { HttpModule } from "@nestjs/axios";
import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "src/auth/auth.module";
import { SharedModule } from "src/shared/shared.module";
import { HelperModule } from "src/helper/helper.module";
import { ServiceResponseController } from "./service-response.controller";
import { ServiceResponseService } from "./service-response.service";
import { serviceResponseSchema } from "./schema/service-response.schema";
import { ServiceRequestModule } from "src/service-request/service-request.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "serviceResponse", schema: serviceResponseSchema },
    ]),
    SharedModule,
    AuthModule,
    HttpModule,
    HelperModule,
    // forwardRef(() => ServiceRequestModule),
  ],
  controllers: [ServiceResponseController],
  providers: [ServiceResponseService],
  exports: [ServiceResponseService],
})
export class ServiceResponseModule {}
