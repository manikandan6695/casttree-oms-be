import {
  createParamDecorator,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from "@nestjs/common";

export const GetOrganization = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    try {
      const req = ctx.switchToHttp().getRequest();
      return data ? req["organization"][data] || "" : req["organization"];
    } catch (err) {
      throw new HttpException(
        "Failed on organization retrival",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
);
