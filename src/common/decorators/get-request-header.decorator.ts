import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const GetRequestHeader = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return data ? req.headers[data] : req.headers;
  }
);

export const GetRequestXHeaders = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const headers = req.headers;
    const xHeaders = Object.keys(headers)
      .filter((key) => key.startsWith("x-"))
      .reduce((result, key) => {
        result[key] = headers[key];
        return result;
      }, {});

    return xHeaders;
  }
);
