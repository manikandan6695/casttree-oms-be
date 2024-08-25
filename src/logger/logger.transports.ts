import * as winston from "winston";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
const { combine, timestamp, printf, errors, prettyPrint, json } =
  winston.format;

const { File, Console } = winston.transports;

@Injectable()
export class LoggerTransport {
  appLog;
  errorLog;
  consoleLog;
  consoleErrorLog;

  constructor(configService: ConfigService) {
    let level: string = configService.get("LOGGER_LEVEL");
    let appLogFormat = printf(({ level, message, label, timestamp }) => {
      let fMsg =
        typeof message == "object" && level != "error"
          ? JSON.stringify(message)
          : message;
      return `${timestamp} [${label}] ${level}: ${fMsg}`;
    });
    let consoleLogFormat = printf(({ level, message, label, timestamp }) => {
      let fMsg =
        typeof message == "object" && level != "error"
          ? JSON.stringify(message)
          : message;
      return `${timestamp} [${label}] ${level}: ${fMsg}`;
    });
    if (configService.get("LOGGER_FILE") == "true") {
      this.appLog = new File({
        level,
        format: combine(timestamp(), json(), appLogFormat),
        filename: configService.get("LOGGER_APP_LOG_PATH"),
      });
      this.errorLog = new File({
        level: "error",
        format: combine(timestamp(), errors({ stack: true }), prettyPrint()),
        filename: configService.get("LOGGER_ERR_LOG_PATH"),
      });
    }

    this.consoleLog = new Console({
      level,
      format: combine(timestamp(), json(), consoleLogFormat),
    });
    this.consoleErrorLog = new Console({
      level: "error",
      format: combine(timestamp(), errors({ stack: true }), prettyPrint()),
    });
  }
  getTransports() {
    return {
      appLog: this.appLog,
      errorLog: this.errorLog,
      consoleLog: this.consoleLog,
      consoleErrorLog: this.consoleErrorLog,
    };
  }
}
