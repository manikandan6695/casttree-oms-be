import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { Inject, Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { HelperService } from "../helper.service";

@Injectable()
export class GetUserOriginMiddleware implements NestMiddleware {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private helperService: HelperService
  ) {}

  async use(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<any> {
    const { headers } = request;
    let latAndLong: any = headers["x-lat-long"] || ""; //12.9716, 77.5946;
    let ipAddress: any =
      headers["x-original-forwarded-for"] ||
      headers["x-forwarded-for"] ||
      headers["x-real-ip"] ||
      "";
    console.log("latAndLong: ", latAndLong, "ipAddress : ", ipAddress);
    let userId = headers["x-user-id"];
    let countryCode: any ;
    /*= userId
      ? await this.cacheManager.get(`countryCode-${userId}`)
      : "";*/
    if (!countryCode) {
      if (latAndLong) {
        let [latitude, longitude] = latAndLong.split(",");
        countryCode = await this.helperService.getCountryCodeByLatAndLong(
          latitude,
          longitude
        );
        console.log("country code inside lat long ===>", countryCode);
      } else if (ipAddress) {
        countryCode =
          await this.helperService.getCountryCodeByIpAddress(ipAddress);
        console.log("country code inside ipAddress ===>", countryCode);
      }
      /*if (countryCode && userId) {
        await this.cacheManager.set(
          `countryCode-${userId}`,
          countryCode,
          86400000
        );
      }*/
    }
    request.headers["x-country-code"] = countryCode;
    next();
  }
}
