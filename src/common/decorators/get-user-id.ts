import {
  createParamDecorator,
  ExecutionContext,
} from "@nestjs/common";
import * as jwt from "jsonwebtoken";

export const GetUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const authorizationHeader = req.headers["authorization"];

    if (!authorizationHeader) {
      return null;
    }
    const pureToken = authorizationHeader.replace("Bearer ", "");

    if (!pureToken) {
      return null;
    }
    try {
      const decoded: any = jwt.decode(pureToken);
      if (!decoded || !decoded.userId) {
        return null;
      }
      return decoded.userId;
    } catch (error) {
      console.error("Failed to decode token");
    }
  }
);
