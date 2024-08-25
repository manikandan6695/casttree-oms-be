import { Global, Module } from "@nestjs/common";
import { CustomLogger } from "./customlogger.service";
import { LogInteceptor } from "./logger.interceptor";
import { LoggerTransport } from "./logger.transports";

@Global()
@Module({
  providers: [CustomLogger, LogInteceptor, LoggerTransport],
  exports: [CustomLogger, LogInteceptor],
})
export class LoggerModule {}
