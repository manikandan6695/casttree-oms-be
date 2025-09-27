import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
// import { LoggerModule } from "src/logger/logger.module";
import { AlertService } from "./alert.service";
import { MailService } from "./mail.service";
import { AllExceptionsFilter } from "./all-exception.filter";
import { SystemConfigurationSchema } from "../shared/schema/system-configuration.schema";

@Module({
  imports: [
    // LoggerModule,
    MongooseModule.forFeature([
      { name: "system-configuration", schema: SystemConfigurationSchema },
    ]),
  ],
  providers: [AlertService, MailService, AllExceptionsFilter],
  exports: [AlertService, MailService, AllExceptionsFilter],
})
export class AlertModule {}
