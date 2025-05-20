import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { HelperService } from "../helper.service";

@Injectable()
// export class GetUserOriginMiddleware implements NestMiddleware {
//   constructor(private helperService: HelperService) {}
//   async use(
//     request: Request,
//     response: Response,
//     next: NextFunction
//   ): Promise<any> {
//     const { headers } = request;
//     let userId = headers["x-userid"];
//     let userData;
//     let countryCode;
//     if (userId) {
//       userData = await this.helperService.getUserById(userId);
//       countryCode = userData?.data?.country_code;
//       if (headers["x-real-ip"] && countryCode == undefined) {
//         countryCode = await this.helperService.getCountryCodeByIpAddress(
//           headers["x-real-ip"].toString()
//         );
//         await this.helperService.updateUserIpById(countryCode, userId);
//       }
//     } else {
//       if (headers["x-real-ip"]) {
//         countryCode = await this.helperService.getCountryCodeByIpAddress(
//           headers["x-real-ip"].toString()
//         );
//       }
//     }
//     request.headers["x-country-code"] = countryCode;
//     next();
//   }
// }
export class GetUserOriginMiddleware implements NestMiddleware {
  constructor(private helperService: HelperService) { }
  async use(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<any> {
    const { headers } = request;
    let userId = headers["x-userid"];
    let userData;
    let countryCode;
    if (userId) {
      userData = await this.helperService.getUserById(userId);
      countryCode = userData?.data?.country_code;
      if (countryCode===undefined) {
        countryCode="IN"
      }
    }
    request.headers["x-country-code"] = countryCode;
    // console.log("userId!", userId, countryCode);
    next();
  }
}