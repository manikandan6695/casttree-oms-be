import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from "@nestjs/common";
import { Request, Response } from "express";
import { MailService } from "./mail.service";
import { CustomLogger } from "src/logger/customlogger.service";
import * as Sentry from "@sentry/nestjs";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly mailService: MailService,
    private readonly logger: CustomLogger
  ) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : "Internal server error";

    const params = request?.params;
    const query = request?.query;
    const body = request?.body;
    const headers = request?.headers;

    Sentry.withScope((scope) => {
      // Set HTTP context
      scope.setContext("http", {
        method: request.method,
        url: request.url,
        status_code: status,
        headers: request.headers,
        query: request.query,
        params: request.params,
      });

      // Set user context if available
      if (request.user) {
        scope.setUser({
          id: (request.user as any).id || (request.user as any)._id,
          email: (request.user as any).email,
          username: (request.user as any).username,
        });
      }

      // Set tags for better filtering in Sentry
      scope.setTag("http.method", request.method);
      scope.setTag("http.status_code", status);
      scope.setTag("http.url", request.url);

      // Add extra context
      scope.setExtra("request_body", request.body);
      scope.setExtra("ip", request.headers["x-forwarded-for"] || request.ip);
      scope.setExtra("user_agent", request.headers["user-agent"]);

      // Set the transaction name for better grouping
      scope.setTransactionName(
        `${request.method} ${request.route?.path || request.url}`
      );

      // Set level based on status code
      if (status >= 500) {
        scope.setLevel("error");
      } else if (status >= 400) {
        scope.setLevel("warning");
      }

      // Now capture the exception with all the context
      Sentry.captureException(exception);
    });

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}