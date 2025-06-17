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
    console.log("headers", headers);

    let userId = headers["x-userid"];
    console.log("header userId", userId);
    if (!userId) {
      console.log("inside not of user id");

      let authorization = headers?.authorization.split(" ")[1];
      const decoded = jwt.verify(
        authorization,
        this.configService.get("JWT_SECRET")
      ) as any;
      userId = decoded?.id;
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
        const ipData = await this.helperService.getCountryCodeByIpAddress(
          headers["x-real-ip"].toString()
        );
        countryCode = ipData?.country_code2;
        await this.helperService.updateUserIpById(countryCode, userId);
        let updatedData = {
          metaData: {
            ...ipData,
          },
          userId: userId,
        };
        // console.log("updatedData", updatedData);
        await this.helperService.updateUserAdditional(updatedData);
      }
    } else {
      console.log("inside ip call is ==>");
      if (headers["x-real-ip"]) {
        const ipData = await this.helperService.getCountryCodeByIpAddress(
          headers["x-real-ip"].toString()
        );
        countryCode = ipData?.country_code2;
        let updatedData = {
          metaData: {
            ...ipData,  
          },
          userId: userId,
        };
        // console.log("updatedData", updatedData);
        await this.helperService.updateUserAdditional(updatedData);
      }
    }
    request.headers["x-country-code"] = countryCode;
    next();
  }
}
