import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const GetReqDetails = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req[data];
  }
);
