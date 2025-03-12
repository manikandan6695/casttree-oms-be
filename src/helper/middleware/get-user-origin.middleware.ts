import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { Inject, Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { HelperService } from "../helper.service";

@Injectable()
export class GetUserOriginMiddleware implements NestMiddleware {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private helperService: HelperService
  ) { }

  async use(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<any> {
    const { headers } = request;

    let latAndLong: string | undefined = headers["x-lat-long"] as string;
    let ipAddress: string | undefined =
      (headers["x-original-forwarded-for"] as string) ??
      (headers["x-forwarded-for"] as string) ??
      (headers["x-real-ip"] as string) ??
      undefined;
    let userId: string | undefined = headers["x-user-id"] as string;

    let countryCode: string | null = null;

    console.log("latAndLong:", latAndLong || "N/A", "ipAddress:", ipAddress || "N/A");

    try {
      if (userId) {
        countryCode = await this.cacheManager.get(`countryCode-${userId}`);
        if (countryCode) {
          console.log(`Cached country code found: ${countryCode}`);
        }
      }
    } catch (error) {
      console.error("Error fetching country code from cache:", error);
    }

    if (!countryCode) {
      try {
        if (latAndLong) {
          const [latitude, longitude] = latAndLong.split(",");
          if (latitude && longitude) {
            countryCode = await this.helperService.getCountryCodeByLatAndLong(
              latitude.trim(),
              longitude.trim()
            );
            console.log("Country code from lat/long ===>", countryCode);
          }
        } else if (ipAddress) {
          countryCode = await this.helperService.getCountryCodeByIpAddress(ipAddress);
          console.log("Country code from IP ===>", countryCode);
        }
      } catch (error) {
        console.error("Error fetching country code from service:", error);
      }
    }

    if (countryCode && userId) {
      try {
        await this.cacheManager.set(`countryCode-${userId}`, countryCode, 86400);
      } catch (error) {
        console.error("Error storing country code in cache:", error);
      }
    }

    if (!countryCode) {
      console.warn("No country code could be determined for this request.");
    }

    if (countryCode) {
      request.headers["x-country-code"] = countryCode;
    }

    next();
  }

}
