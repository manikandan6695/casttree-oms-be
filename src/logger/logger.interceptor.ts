import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { Request } from "express";
import { CustomLogger } from "./customlogger.service";

@Injectable()
export class LogInteceptor implements NestInterceptor {
  constructor(private logger: CustomLogger) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req: Request = context.switchToHttp().getRequest();
    const now = Date.now();
    const onClose = () => {
      this.logger.log(
        { method: req.method, url: req.url, duration: `${Date.now() - now}ms` },
        context.getClass().name
      );
    };
    req.on("close", onClose.bind(this));
    return next.handle();
  }
}
