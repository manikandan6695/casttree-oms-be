import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { CustomLogger } from "src/logger/customlogger.service";
import { AuthService } from "../auth.service";

@Injectable()
export class FormSystemConfiguration implements NestInterceptor {
  constructor(
    private auth_service: AuthService,
    private logger_service: CustomLogger
  ) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>
  ): Promise<Observable<any>> {
    try {
      let request = context.switchToHttp().getRequest();
      let system_configuration = await this.auth_service.getSystemConfig();
      request["system_configuration"] = system_configuration;
      return next.handle();
    } catch (err) {
      this.logger_service.error(err, "SystemConfiguration");
      throw new HttpException("Not Acceptable!", HttpStatus.NOT_ACCEPTABLE);
    }
  }
}
