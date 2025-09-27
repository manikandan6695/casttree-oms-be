import { Global, Module } from "@nestjs/common";
import { CustomLogger } from "./customlogger.service";
import { LogInteceptor } from "./logger.interceptor";
import { LoggerTransport } from "./logger.transports";
import { MailService } from "src/logger/mail.service";
import { MongooseModule } from "@nestjs/mongoose";
import { SystemConfigurationSchema } from "src/shared/schema/system-configuration.schema";
@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: "systemConfiguration", schema: SystemConfigurationSchema },
    ]),
  ],
  providers: [CustomLogger, LogInteceptor, LoggerTransport, MailService],
  exports: [CustomLogger, LogInteceptor, MailService],
})
export class LoggerModule {}
