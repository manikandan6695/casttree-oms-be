import {
  createParamDecorator,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from "@nestjs/common";

export const GetPortalName = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    let organization_portal_name = req.headers["organization"];
    if (!organization_portal_name)
      throw new HttpException(
        "Organization is required",
        HttpStatus.BAD_REQUEST
      );
    return organization_portal_name;
  }
);
