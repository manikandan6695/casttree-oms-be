import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable,
  HttpException,
} from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { Request, Response } from "express";
import { CustomLogger } from "./customlogger.service";
import { MailService } from "./mail.service";
 
@Injectable()
export class LogInteceptor implements NestInterceptor {
  constructor(
    private logger: CustomLogger,
    private mailService: MailService
  ) {}
 
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req: Request = context.switchToHttp().getRequest();
    const res: Response = context.switchToHttp().getResponse();
    const now = Date.now();
 
    return next.handle().pipe(
      tap(() => {
        // Handle successful requests
        this.logRequest(req, res, context, now);
      }),
      catchError((error) => {
        // Handle errors
        this.logAndSendError(req, res, context, now, error);
        return throwError(() => error);
      })
    );
  }
 
  private logRequest(
    req: Request,
    res: Response,
    context: ExecutionContext,
    startTime: number
  ) {
    const onClose = () => {
      this.logger.log(
        {
          method: req.method,
          url: req.url,
          duration: `${Date.now() - startTime}ms`,
        },
        context.getClass().name
      );
    };
    res.on("close", onClose.bind(this));
  }
 
  private async logAndSendError(
    req: Request,
    res: Response,
    context: ExecutionContext,
    startTime: number,
    error: any
  ) {
    const errorDetails = this.extractErrorDetails(error);
    const status = error instanceof HttpException ? error.getStatus() : 500;
 
    const templateVariables = {
      service: `Casttree-oms Backend (${context.getClass().name})`,
      path: req?.url || "N/A",
      method: req?.method || "N/A",
      user_agent: req?.headers?.["user-agent"] || "N/A",
      ip: req?.headers?.["x-forwarded-for"] || req?.ip || "N/A",
      status: status.toString(),
      error_type: errorDetails.type,
      error_message: errorDetails.message,
      headers: req?.headers ? JSON.stringify(req.headers, null, 2) : "N/A",
      params: req?.params ? JSON.stringify(req.params) : "N/A",
      query: req?.query ? JSON.stringify(req.query) : "N/A",
      body: req?.body ? JSON.stringify(req.body) : "N/A",
      stack_trace: errorDetails.stack,
      timestamp: new Date().toISOString(),
      sender_name: "Casttree (Interceptor Error)",
      sender_email: "alerts@casttree.in",
      sender_contact: "+91-8015584624",
      // external_api_reason: error["response"]?.data?.error,
      // external_api_url: error["response"]?.config?.url,
      // external_api_body: error["response"]?.config?.data,
      // external_api_code: error["response"]?.status,
    };
 
    try {
      if (status >= 500) {
        await this.mailService.sendErrorLog(
          "🚨 Interceptor Error Alert! CASTTREE-OMS",
          templateVariables
        );
      }
    } catch (mailError) {
      console.log("Error sending email from interceptor", mailError);
    }
 
    this.logger.error(error, { label: context.getClass().name });
  }
 
  private extractErrorDetails(exception: any) {
    const errorType = exception?.constructor?.name || "Unknown";
    let message = exception?.message || "No message";
    let stack = exception?.stack || "No stack trace available";
 
    // Handle Axios errors specifically
    if (exception?.isAxiosError) {
      const config = exception?.config;
      const response = exception?.response;
 
      const axiosInfo = `${config?.method?.toUpperCase()} ${config?.url} → ${response?.status} ${response?.statusText}`;
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
      stack,
    };
  }
}