import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Observable } from "rxjs";
import { Request } from "express";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.header("authorization");
    if (!authorization) return false;

    /**
     * Example to inject something in
     * request. This can be from database also
     */
    //context.switchToHttp().getRequest<Request>().headers.licenseId = licenseId;
    return true;
  }
}
