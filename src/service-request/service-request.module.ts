import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "src/auth/auth.module";
import { HelperModule } from "src/helper/helper.module";
import { SharedModule } from "src/shared/shared.module";
import { serviceRequestSchema } from "./schema/serviceRequest.schema";
import { ServiceRequestController } from "./service-request.controller";
import { ServiceRequestService } from "./service-request.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "serviceRequest", schema: serviceRequestSchema },
    ]),
    SharedModule,
    AuthModule,
    HttpModule,
    HelperModule,
  ],
  controllers: [ServiceRequestController],
  providers: [ServiceRequestService],
})
export class ServiceRequestModule {}
