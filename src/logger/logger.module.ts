import { Global, Module } from "@nestjs/common";
import { CustomLogger } from "./customlogger.service";
import { LogInteceptor } from "./logger.interceptor";
import { LoggerTransport } from "./logger.transports";
import { MailService } from "src/shared/mail.service";

@Global()
@Module({
  providers: [CustomLogger, LogInteceptor, LoggerTransport, MailService],
  exports: [CustomLogger, LogInteceptor],
})
export class LoggerModule {}
