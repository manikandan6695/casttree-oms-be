import { forwardRef, Inject, Injectable, NestMiddleware, HttpException, HttpStatus } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { HelperService } from "../helper.service";
import { ConfigService } from "@nestjs/config";
var jwt = require("jsonwebtoken");

@Injectable()
export class GetUserOriginMiddleware implements NestMiddleware {
  constructor(
    // @Inject(forwardRef(() => HelperService))
    private helperService: HelperService,
    private configService: ConfigService
  ) {}
  async use(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<any> {
    const { headers } = request;
    console.log("headers", headers);

    let userId = headers["x-userid"];
    console.log("header userId", userId);
    if (!userId) {
      console.log("inside not of user id");

      // Check if authorization header exists and is not null/undefined
      if (headers?.authorization) {
        const authParts = headers.authorization.split(" ");
        if (authParts.length === 2 && authParts[0] === "Bearer") {
          const token = authParts[1];
          
          // Handle "Bearer null" case before JWT verification
          if (!token || token === "null" || token === "undefined") {
            console.log("Invalid or null token provided:", token);
            throw new HttpException("Invalid token", HttpStatus.UNAUTHORIZED);
          }

          try {
            const decoded = jwt.verify(
              token,
              this.configService.get("JWT_SECRET")
            ) as any;
            userId = decoded?.id;
          } catch (error) {
            console.error("JWT verification failed:", error.message);
            
            // Map JWT errors to appropriate HTTP status codes
            if (error.name === 'TokenExpiredError') {
              throw new HttpException("Token expired", HttpStatus.UNAUTHORIZED);
            } else if (error.name === 'JsonWebTokenError') {
              throw new HttpException("Invalid token", HttpStatus.UNAUTHORIZED);
            } else if (error.name === 'NotBeforeError') {
              throw new HttpException("Token not active", HttpStatus.UNAUTHORIZED);
            } else {
              throw new HttpException("Token verification failed", HttpStatus.UNAUTHORIZED);
            }
          }
        } else {
          console.log("Invalid authorization header format");
          throw new HttpException("Invalid authorization header format", HttpStatus.UNAUTHORIZED);
        }
      } else {
        console.log("No authorization header provided");
        // No authorization header - continue without userId (fallback to IP-based detection)
      }
    }
    console.log("userId", userId);
    let userData;
    let countryCode;
    if (userId) {
      console.log("inside user id is");
      userData = await this.helperService.getUserById(userId);
      countryCode = userData?.data?.country_code;
      console.log("countryCode", countryCode);
      if (headers["x-real-ip"] && countryCode == undefined) {
        countryCode = await this.helperService.getCountryCodeByIpAddress(
          headers["x-real-ip"].toString()
        );
        await this.helperService.updateUserIpById(countryCode, userId);
      }
    } else {
      console.log("inside ip call is ==>");
      if (headers["x-real-ip"]) {
        countryCode = await this.helperService.getCountryCodeByIpAddress(
          headers["x-real-ip"].toString()
        );
      }
    }
    request.headers["x-country-code"] = countryCode;
    next();
  }
}