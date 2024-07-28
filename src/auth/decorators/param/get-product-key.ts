import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const GetProductKey = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.headers["productkey"];
  }
);
