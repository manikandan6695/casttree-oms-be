import { LoggerService, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as winston from "winston";
import { LoggerTransport } from "./logger.transports";

@Injectable()
export class CustomLogger implements LoggerService {
  logger: winston.Logger;

  constructor(tservice: LoggerTransport, configService: ConfigService) {
    const {
      appLog,
      errorLog,
      consoleLog,
      consoleErrorLog,
    } = tservice.getTransports();

    this.logger = winston.createLogger({ transports: [] });
    this.logger.exitOnError = false;
    if (configService.get("LOGGER_FILE") == "true") {
      this.logger.add(appLog);
      this.logger.add(errorLog);
    }
    if (configService.get("LOGGER_CONSOLE") == "true") {
      this.logger.add(consoleLog);
      this.logger.add(consoleErrorLog);
    }
    this.logger.log({
      level: "info",
      label: "APP",
      message: "-----------Server started-----------",
    });
  }
  error(message: any, meta?: any, context?: string, trace?: string) {
    //message - instance of Error
    //meta - {label: context} module on which error occurs
    this.logger.error(message, meta);
  }
  log(message: any, context?: string) {
    // message - message want to display can be either js object or a string msg
    // context - module from which the request triggered
    this.logger.log({
      level: "info",
      label: context || "APP",
      message: message || "NA",
    });
  }
  warn(message: any, context?: string) {
    this.logger.log({
      level: "warn",
      label: context || "APP",
      message: message || "NA",
    });
  }
  debug?(message: any, context?: string) {
    this.logger.log({
      level: "debug",
      label: context || "APP",
      message: message || "NA",
    });
  }
  verbose?(message: any, context?: string) {
    this.logger.log({
      level: "verbose",
      label: context || "APP",
      message: message || "NA",
    });
  }
}

// error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5
