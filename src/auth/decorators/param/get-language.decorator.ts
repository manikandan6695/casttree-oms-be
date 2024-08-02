import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const GetLanguage = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req?.headers?.language;
  }
);
