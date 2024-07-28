import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { JsonWebTokenError } from "jsonwebtoken";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  handleRequest(err: any, user: any, info: any, context: any, status: any) {
    try {
      if (info instanceof JsonWebTokenError) {
        throw new HttpException(
          "You have been Logged out!!",
          HttpStatus.UNAUTHORIZED
        );
      }
      return super.handleRequest(err, user, info, context, status);
    } catch (err) {
      console.log("err", err);
      throw new HttpException(
        "Failed on token validation",
        HttpStatus.UNAUTHORIZED
      );
    }
  }
}
