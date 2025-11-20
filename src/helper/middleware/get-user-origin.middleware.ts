import { Injectable, NestMiddleware, UnauthorizedException, Logger } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { HelperService } from "../helper.service";
import { ConfigService } from "@nestjs/config";
var jwt = require("jsonwebtoken");

@Injectable()
export class GetUserOriginMiddleware implements NestMiddleware {
  private readonly logger = new Logger(GetUserOriginMiddleware.name);
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
    // console.log("headers", headers);

    let userId = headers["x-userid"];
    // console.log("header userId", userId);
    if (!userId) {
      // console.log("inside not of user id");

      let authorization = headers?.authorization;
      if (!authorization) {
        throw new UnauthorizedException("Access token is required");
      }
      if (!authorization.startsWith("Bearer ")) {
          
        throw new UnauthorizedException("Invalid token format");
      }
      const token = authorization.split(" ")[1];
      if (!token) {
        
        throw new UnauthorizedException("Invalid token format");
      }
      try {
      const decoded = jwt.verify(
        authorization,
        this.configService.get("JWT_SECRET")
      ) as any;
      userId = decoded?.id;
      if (!userId) {  
        throw new UnauthorizedException("Authentication failed");
      }
    } catch (jwtError) {
      this.handleJWTError(jwtError);
    }
    }
    // console.log("userId", userId);
    let userData;
    let countryCode;
    if (userId) {
      // console.log("inside user id is");
      try { 
      userData = await this.helperService.getUserById(userId);
      if (!userData?.data) {
        throw new UnauthorizedException("User not found or inactive");
      }
      countryCode = userData?.data?.country_code;
      // console.log("countryCode", countryCode);
      if (headers["x-real-ip"] && !countryCode) {
        try {
          countryCode = await this.helperService.getCountryCodeByIpAddress(
            headers["x-real-ip"].toString()
          );
          await this.helperService.updateUserIpById(countryCode, userId);
        } catch (ipError) {
          this.logger.warn("Failed to get country code from IP", { 
            error: ipError.message,
            ip: headers["x-real-ip"] 
          });
        }
      }
    } catch (userError) {
      throw new UnauthorizedException("Authentication failed");
    }
    } 
    else {
      await this.handleCountryCodeFallback(request, headers);
      return next();
    }
    request.headers["x-country-code"] = countryCode;
      
    next();
  } catch (error) {
    if (error instanceof UnauthorizedException) {
      throw error;
    }
    throw new UnauthorizedException("Authentication failed");
  }
  private handleJWTError(jwtError: any): never {
    
    if (jwtError.name === 'TokenExpiredError') {
      throw new UnauthorizedException("Access token has expired");
    }
    
    if (jwtError.name === 'JsonWebTokenError') {
      if (jwtError.message.includes('invalid signature')) {
        throw new UnauthorizedException("Invalid access token");
      }
      if (jwtError.message.includes('jwt malformed')) {
        throw new UnauthorizedException("Invalid token format");
      }
      throw new UnauthorizedException("Invalid access token");
    }
    
    if (jwtError.name === 'NotBeforeError') {
      throw new UnauthorizedException("Authentication failed");
    }
    
    // Generic JWT error
    throw new UnauthorizedException("Authentication failed");
  }

  private async handleCountryCodeFallback(request: Request, headers: any): Promise<void> {
    try {
      if (headers["x-real-ip"]) {
        this.logger.debug("Attempting IP-based country detection", { 
          ip: headers["x-real-ip"] 
        });
        
        const countryCode = await this.helperService.getCountryCodeByIpAddress(
          headers["x-real-ip"].toString()
        );
        
        request.headers["x-country-code"] = countryCode;
        this.logger.debug("Set country code from IP", { countryCode });
      } else {
        this.logger.debug("No IP address available for country detection");
      }
    } catch (ipError) {
      this.logger.warn("Failed to get country code from IP", { 
        error: ipError.message,
        ip: headers["x-real-ip"] 
      });
    }
  }
}
