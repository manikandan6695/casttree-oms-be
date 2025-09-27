import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from "@nestjs/common";
import { Request, Response } from "express";
import { MailService } from "./mail.service";
import { CustomLogger } from "src/logger/customlogger.service";

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

    // Enhanced error details
    const errorDetails = this.extractErrorDetails(exception);

    // Template variables for MSG91 email template
    const templateVariables = {
      service: "Casttree-oms Backend",
      path: request?.url,
      method: request?.method,
      user_agent: request?.headers["user-agent"] || "N/A",
      ip: request?.headers["x-forwarded-for"] || request?.ip || "N/A",
      status: status.toString(),
      error_type: errorDetails?.type,
      error_message: errorDetails?.message,
      headers: JSON.stringify(headers, null, 2) || "N/A",
      params: JSON.stringify(params) || "N/A",
      query: JSON.stringify(query) || "N/A",
      body: JSON.stringify(body) || "N/A",
      stack_trace: errorDetails?.stack,
      timestamp: new Date().toISOString(),
      sender_name: "Casttree (Exception Filter)",
      sender_email: "alerts@casttree.in",
      sender_contact: "+91-8015584624",
      // external_api_reason: exception["response"]?.data?.error,
      // external_api_url: exception["response"]?.config?.url,
      // external_api_body: exception["response"]?.config?.data,
      // external_api_code: exception["response"]?.status,
    };

    try {
      if (status >= 500) {
        await this.mailService.sendErrorLog(
          "🚨 Error Alert! CASTTREE-OMS",
          templateVariables
        );
      }
    } catch (error) {
      console.log("Error sending email", error);
    }

    this.logger.error(exception, {
      label: exception["context"] || "Exception Filter",
    });

    response.status(status).json({
      statusCode: status,
      message,
    });
  }

  private extractErrorDetails(exception: any) {
    const errorType = exception?.constructor?.name || "Unknown";
    let message = exception?.message || "No message";
    let axiosInfo = null;
    let stack = exception?.stack || "No stack trace available";

    // Handle Axios errors specifically
    if (exception?.isAxiosError) {
      const config = exception?.config;
      const response = exception?.response;

      axiosInfo = `${config?.method?.toUpperCase()} ${config?.url} → ${response?.status} ${response?.statusText}`;
      message = `Axios Error: ${response?.data?.message || exception?.message}`;

      // Clean up stack to show more relevant frames
      if (stack) {
        const lines = stack.split("\n");
        const relevantLines = lines
          .filter(
            (line) =>
              !line.includes("node_modules/axios") &&
              !line.includes("node_modules/@nestjs") &&
              (line.includes("src/") || line.includes("at "))
          )
          .slice(0, 10); // Limit to 10 most relevant lines

        if (relevantLines.length > 0) {
          stack = relevantLines.join("\n");
        }
      }
    }

    return {
      type: errorType,
      message,
      axiosInfo,
      stack,
    };
  }
}
