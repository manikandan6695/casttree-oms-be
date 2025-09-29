import { forwardRef, Inject, Injectable, NestMiddleware } from "@nestjs/common";
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
    try {
      const { headers } = request;
      console.log("headers", headers);

    let userId = headers["x-userid"];
    console.log("header userId", userId);
    if (!userId) {
      console.log("inside not of user id");

      let authorization = headers?.authorization?.split(" ")[1];
      
      // Validate authorization token before JWT verification
      if (!authorization || authorization === 'null' || authorization === 'undefined' || authorization.trim() === '') {
        console.log("Invalid or missing authorization token:", authorization);
        // Continue without userId - will use IP-based country detection
      } else {
        try {
          const decoded = jwt.verify(
            authorization,
            this.configService.get("JWT_SECRET")
          ) as any;
          userId = decoded?.id;
        } catch (error) {
          console.error("JWT verification failed:", error.message);
          // Continue without userId - will use IP-based country detection
        }
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
    } catch (error) {
      console.error("GetUserOriginMiddleware error:", error);
      // Set default country code and continue
      request.headers["x-country-code"] = "IN"; // Default to India
      next();
    }
  }
}