import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { HelperService } from "../helper.service";
import { ConfigService } from "@nestjs/config";
var jwt = require("jsonwebtoken");

@Injectable()
export class GetUserOriginMiddleware implements NestMiddleware {
  constructor(
    private helperService: HelperService,
    private configService: ConfigService
  ) {}
  async use(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<any> {
    const { headers } = request;
    let userId = headers["x-userid"];
    // console.log("header userId", userId, headers);
    if (!userId || userId == undefined) {
      // console.log("authorization", headers?.authorization);
      if (headers?.authorization) {
        let authorization = headers?.authorization.split(" ")[1];
        const decoded = jwt.verify(
          authorization,
          this.configService.get("JWT_SECRET")
        ) as any;
        userId = decoded?.id;
      }
    }
    // console.log("UserId", userId);
    let userData;
    let countryCode;
    if (userId) {
      // console.log("inside userId");
      userData = await this.helperService.getUserById(userId);
      countryCode = userData?.data?.country_code;
      // console.log("countryCode", countryCode);

      if (headers["x-real-ip"] && countryCode == undefined) {
        // console.log("inside get ip");

        countryCode = await this.helperService.getCountryCodeByIpAddress(
          headers["x-real-ip"].toString()
        );
        await this.helperService.updateUserIpById(countryCode, userId);
      }
    } else {
      // console.log("inside ip call");
      if (headers["x-real-ip"]) {
        countryCode = await this.helperService.getCountryCodeByIpAddress(
          headers["x-real-ip"].toString()
        );
      }
    }

    request.headers["x-country-code"] = countryCode;
    next();
    // console.log("headers country code", request.headers["x-country-code"]);
  }
}
