import { Injectable } from "@nestjs/common";
import winston, { LoggerOptions } from "winston";
import * as Transport from "winston-transport";
import DailyRotateFile from "winston-daily-rotate-file";
import { IDebuggerOptionService } from "../interfaces/debugger.options-service.interface";
import { DEBUGGER_NAME } from "../constants/debugger.constant";
import { NestVaultService } from "../../nest-vault/nest-vault.service";

@Injectable()
export class DebuggerOptionService implements IDebuggerOptionService {
  constructor(private configService: NestVaultService) {}

  createLogger(): LoggerOptions {
    const writeIntoFile = this.configService.get<boolean>(
      "debugger.writeIntoFile",
    );
    const maxSize = this.configService.get<string>("debugger.maxSize");
    const maxFiles = this.configService.get<string>("debugger.maxFiles");

    const transports: Transport[] | Transport = [
      new winston.transports.Console(),
    ];

    if (writeIntoFile) {
      transports.push(
        new DailyRotateFile({
          filename: `%DATE%.log`,
          dirname: `logs/${DEBUGGER_NAME}/error`,
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: maxSize,
          maxFiles: maxFiles,
          level: "error",
        }),
      );
      transports.push(
        new DailyRotateFile({
          filename: `%DATE%.log`,
          dirname: `logs/${DEBUGGER_NAME}/default`,
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: maxSize,
          maxFiles: maxFiles,
          level: "info",
        }),
      );
      transports.push(
        new DailyRotateFile({
          filename: `%DATE%.log`,
          dirname: `logs/${DEBUGGER_NAME}/debug`,
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: maxSize,
          maxFiles: maxFiles,
          level: "debug",
        }),
      );
    }

    const loggerOptions: LoggerOptions = {
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.prettyPrint(),
      ),
      transports,
    };

    return loggerOptions;
  }
}
