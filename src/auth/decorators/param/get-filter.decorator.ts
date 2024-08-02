import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const GetFilters = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.filterDetails;
  }
);
