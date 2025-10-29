import { 
  forwardRef, 
  Inject, 
  Injectable, 
  NestMiddleware, 
  UnauthorizedException,
  Logger 
} from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { HelperService } from "../helper.service";
import { ConfigService } from "@nestjs/config";
var jwt = require("jsonwebtoken");

@Injectable()
export class GetUserOriginMiddleware implements NestMiddleware {
  private readonly logger = new Logger(GetUserOriginMiddleware.name);

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
      this.logger.debug("Processing request headers", { headers: Object.keys(headers) });

      let userId = headers["x-userid"];
      this.logger.debug("Header userId", { userId });

      if (!userId) {
        this.logger.debug("No userId in headers, attempting JWT validation");
        
        const authorization = headers?.authorization;
        if (!authorization) {
          this.logger.warn("No authorization header found");
          throw new UnauthorizedException("Access token is required");
        }

        // Check if header follows "Bearer <token>" format
        if (!authorization.startsWith("Bearer ")) {
          this.logger.warn("Malformed authorization header", { authorization });
          throw new UnauthorizedException("Invalid token format");
        }

        const token = authorization.split(" ")[1];
        if (!token) {
          this.logger.warn("No token found in authorization header");
          throw new UnauthorizedException("Invalid token format");
        }

        try {
          const decoded = jwt.verify(
            token,
            this.configService.get("JWT_SECRET")
          ) as any;
          
          userId = decoded?.id;
          if (!userId) {
            this.logger.warn("No user ID found in decoded token");
            throw new UnauthorizedException("Authentication failed");
          }
          
          this.logger.debug("Successfully decoded JWT token", { userId });
        } catch (jwtError) {
          this.handleJWTError(jwtError);
        }
      }

      let userData;
      let countryCode;
      
      if (userId) {
        this.logger.debug("Processing user data for userId", { userId });
        
        try {
          userData = await this.helperService.getUserById(userId);
          
          if (!userData?.data) {
            this.logger.warn("User not found in database", { userId });
            throw new UnauthorizedException("User not found or inactive");
          }
          
          countryCode = userData.data.country_code;
          this.logger.debug("Retrieved country code from user data", { countryCode });
          
          // Fallback to IP-based country detection if no country code
          if (headers["x-real-ip"] && !countryCode) {
            this.logger.debug("No country code found, using IP-based detection");
            try {
              countryCode = await this.helperService.getCountryCodeByIpAddress(
                headers["x-real-ip"].toString()
              );
              await this.helperService.updateUserIpById(countryCode, userId);
              this.logger.debug("Updated user country code from IP", { countryCode });
            } catch (ipError) {
              this.logger.warn("Failed to get country code from IP", { 
                error: ipError.message,
                ip: headers["x-real-ip"] 
              });
            }
          }
        } catch (userError) {
          this.logger.error("Error processing user data", { 
            userId, 
            error: userError.message 
          });
          throw new UnauthorizedException("Authentication failed");
        }
      } else {
        this.logger.debug("No userId available, using IP-based country detection");
        await this.handleCountryCodeFallback(request, headers);
        return next();
      }

      request.headers["x-country-code"] = countryCode;
      this.logger.debug("Request processing completed", { 
        userId, 
        countryCode,
        hasUserData: !!userData 
      });
      
      next();
    } catch (error) {
      this.logger.error("Middleware error", { 
        error: error.message,
        stack: error.stack 
      });
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      // For other errors, throw authentication failed
      this.logger.warn("Non-auth error in middleware", {
        error: error.message
      });
      
      throw new UnauthorizedException("Authentication failed");
    }
  }

  private handleJWTError(jwtError: any): never {
    this.logger.warn("JWT validation failed", { error: jwtError.message });
    
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