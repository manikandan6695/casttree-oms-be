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
import { serviceRequestSchema } from "src/service-request/schema/serviceRequest.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "serviceResponse", schema: serviceResponseSchema },
      { name: "serviceRequest", schema: serviceRequestSchema },
    ]),
    SharedModule,
    AuthModule,
    HttpModule,
    forwardRef(() => ServiceRequestModule),
    forwardRef(() => HelperModule),
  ],
  controllers: [ServiceResponseController],
  providers: [ServiceResponseService],
  exports: [ServiceResponseService],
})
export class ServiceResponseModule {}
