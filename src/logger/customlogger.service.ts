import { LoggerService, Injectable } from "@nestjs/common";
import * as winston from "winston";
const LokiTransport = require("winston-loki");

@Injectable()
export class CustomLogger implements LoggerService {
  logger: winston.Logger;

  constructor() {
    // Get environment variables
    const nodeEnv = process.env.NODE_ENV;
    const loggerLevel = process.env.LOGGER_LEVEL;
    const enableLoki = process.env.LOGGER_ENABLE_LOKI;
    const lokiUrl = process.env.LOGGER_LOKI_URL;
    const lokiApp = process.env.LOKI_LOGGER_APP;
    const lokiService = process.env.LOKI_LOGGER_SERVICE;

    // Create transports array
    const transports: winston.transport[] = [];

    // Console transport (always enabled)
    transports.push(
      new winston.transports.Console({
        level: loggerLevel,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(
            ({ timestamp, level, message, label, service }) => {
              const fMsg =
                typeof message === "object" ? JSON.stringify(message) : message;
              const serviceTag = service
                ? `[${service}]`
                : `[${label || "APP"}]`;
              return `${timestamp} ${serviceTag} ${level}: ${fMsg}`;
            }
          )
        ),
      })
    );

    // File transports (if enabled)
    // if (process.env.LOGGER_FILE === "true") {
    //   const appLogPath = process.env.LOGGER_APP_LOG_PATH || "logs/app.log";
    //   const errLogPath = process.env.LOGGER_ERR_LOG_PATH || "logs/error.log";

    //   transports.push(
    //     new winston.transports.File({
    //       filename: appLogPath,
    //       level: loggerLevel,
    //       format: winston.format.combine(
    //         winston.format.timestamp(),
    //         winston.format.json()
    //       ),
    //     })
    //   );

    //   transports.push(
    //     new winston.transports.File({
    //       filename: errLogPath,
    //       level: "error",
    //       format: winston.format.combine(
    //         winston.format.timestamp(),
    //         winston.format.json()
    //       ),
    //     })
    //   );
    // }

    // Loki transport (if enabled)
    if (enableLoki) {
      try {
        const lokiTransport = new LokiTransport({
          host: lokiUrl,
          labels: {
            app: lokiApp,
            env: nodeEnv,
            service: lokiService,
          },
          json: true,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
          onConnectionError: (err) => {
            console.error("Loki connection error:", err);
          },
        });

        transports.push(lokiTransport);
      } catch (error) {
        console.error("Failed to initialize Loki transport:", error);
      }
    }

    // Create logger with all transports
    this.logger = winston.createLogger({
      level: loggerLevel,
      transports,
      exitOnError: false,
    });

    // Log server start message
    this.logger.log({
      level: "info",
      label: "APP",
      message: "-----------Server started-----------",
      service: "APP",
    });
  }

  error(message: any, meta?: any, context?: string, trace?: string) {
    this.logger.error({
      level: "error",
      label: context || "APP",
      message: message || "NA",
      meta,
      trace,
      service: context || "APP",
    });
  }

  log(message: any, context?: string) {
    this.logger.log({
      level: "info",
      label: context || "APP",
      message: message || "NA",
      service: context || "APP",
    });
  }

  warn(message: any, context?: string) {
    this.logger.log({
      level: "warn",
      label: context || "APP",
      message: message || "NA",
      service: context || "APP",
    });
  }

  debug?(message: any, context?: string) {
    this.logger.log({
      level: "debug",
      label: context || "APP",
      message: message || "NA",
      service: context || "APP",
    });
  }

  verbose?(message: any, context?: string) {
    this.logger.log({
      level: "verbose",
      label: context || "APP",
      message: message || "NA",
      service: context || "APP",
    });
  }
}

// error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5
