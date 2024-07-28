import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const GetSingleData = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req["single_data"];
  }
);
