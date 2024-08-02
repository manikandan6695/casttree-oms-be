import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const GetSourceDetails = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req[data];
  }
);
