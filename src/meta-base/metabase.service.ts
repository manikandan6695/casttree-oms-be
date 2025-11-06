import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { SharedService } from '../shared/shared.service';
import { EMetabaseUrlLimit } from '../helper/enums/mixedPanel.enums';
import { EMixedPanelEvents } from '../helper/enums/mixedPanel.enums';
import * as http from "http";
import * as https from "https";
import { BannerResponseDto } from './dto/banner.dto';
import { HelperService } from 'src/helper/helper.service';
import { ERecommendationListType } from 'src/item/enum/serviceItem.type.enum';
import { ServiceItemService } from 'src/item/service-item.service';
@Injectable()
export class MetaBaseService {
  constructor(
    private readonly http_service: HttpService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly sharedService: SharedService,
    private readonly helperService: HelperService,
    @Inject(forwardRef(() => ServiceItemService))
    private readonly serviceItemService: ServiceItemService
  ) { }
  private httpAgent = new http.Agent({ keepAlive: true, maxSockets: 50 });
  private httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 50 });

  private async refreshMetabaseSession(): Promise<string> {
    try {
      await this.redisService.getClient()?.del("metabase:session");

      return await this.createMetabaseSession();
    } catch (error) {
      throw error;
    }
  }

  private async createMetabaseSession(): Promise<string> {
    try {
      const metabaseBaseUrl = this.configService.get("METABASE_BASE_URL");
      const username = this.configService.get("METABASE_USERNAME");
      const encryptedPassword = this.configService.get("METABASE_PASSWORD");

      if (!metabaseBaseUrl || !username || !encryptedPassword) {
        throw new Error("Metabase credentials not configured");
      }

      // Decrypt the password before using it
      const password = this.sharedService.decryptMessage(encryptedPassword);

      const requestBody = {
        username: username,
        password: password,
      };

      const headers = {
        "Content-Type": "application/json",
      };
      const response = await this.http_service
        .post(`${metabaseBaseUrl}/api/session/`, requestBody, { headers })
        .toPromise();

      const sessionId = response.data?.id;
      if (!sessionId) {
        throw new Error("Failed to create Metabase session");
      }

      // Store session in Redis with 24 hour expiration
      await this.redisService
        .getClient()
        ?.setEx("metabase:session", 86400, sessionId);
      return sessionId;
    } catch (error) {
      throw new Error(`Failed to create Metabase session: ${error.message}`);
    }
  }

  private async getSystemConfigByKeyCached(
    key: string,
    ttlSeconds = 300
  ): Promise<any> {
    const cacheKey = `systemConfig:${key}`;
    const client = this.redisService.getClient();
    try {
      const cached = await client?.get(cacheKey);
      if (cached) {
        return JSON.parse(cached as string);
      }
    } catch (e) {}
    const fresh = await this.helperService.getSystemConfigByKey(key);
    try {
      await client?.setEx(cacheKey, ttlSeconds, JSON.stringify(fresh));
    } catch (e) {}
    return fresh;
  }

  private async getMetabaseSession(): Promise<string> {
    try {
      // Try to get session from Redis first
      const cachedSession = await this.redisService
        .getClient()
        ?.get("metabase:session");
      if (cachedSession && typeof cachedSession === "string") {
        return cachedSession;
      }

      // If no cached session, create a new one
      return await this.createMetabaseSession();
    } catch (error) {
      // Fallback to creating a new session if Redis fails
      return await this.createMetabaseSession();
    }
  }

  async getBannerToShow(
    userId: string,
    skillId: string,
    skillType: string,
    componentKey: string
  ): Promise<BannerResponseDto> {
    try {
      const metabaseBaseUrl = this.configService.get("METABASE_BASE_URL");


      // Get session (from cache or create new)
      let metabaseSession = await this.getMetabaseSession();
      const requestBody = {
        parameters: [
          {
            type: "text",
            target: ["variable", ["template-tag", "userid"]],
            value: userId,
          },
          {
            type: "text",
            target: ["variable", ["template-tag", "skill_id"]],
            value: skillId,
          },
        ],
      };

      const headers = {
        "Content-Type": "application/json",
        "X-Metabase-Session": metabaseSession,
      };
      let systemConfiguration = await this.getSystemConfigByKeyCached(
        EMetabaseUrlLimit.dynamic_banner
      );
      let metaCart;

      if (
        systemConfiguration?.value &&
        Array.isArray(systemConfiguration.value)
      ) {
        const matchingConfig = systemConfiguration.value.find(
          (config) => config.key === componentKey
        );
        if (matchingConfig) {
          metaCart = matchingConfig.value;
        }
      }

      const fullUrl = `${metabaseBaseUrl}/api/card/${metaCart}/query`;
      try {
        const response = await this.http_service
          .post(fullUrl, requestBody, {
            headers,
            timeout: 5000,
            httpAgent: this.httpAgent,
            httpsAgent: this.httpsAgent,
          })
          .toPromise();

        let defaultBannerId = await this.getSystemConfigByKeyCached(
          EMetabaseUrlLimit.default_banner
        );
        // console.log("defaultBannerId",defaultBannerId?.value);
        let defaultBanner;
        // Find matching banner based on skillId and skillType
        if (defaultBannerId?.value && Array.isArray(defaultBannerId.value)) {
          const matchingBanner = defaultBannerId.value.find(
            (banner) =>
              banner.sourceId.toString() === skillId.toString() &&
              banner.sourceType === skillType
          );
          // console.log("matchingBanner",matchingBanner);
          if (matchingBanner) {
            defaultBanner = matchingBanner.bannerId;
          }
        }
        const flattenedRows = response.data?.data?.rows?.flat() || [];
        const hasValidBanners = flattenedRows && flattenedRows.length > 0 && flattenedRows.some(banner => banner !== null);
        
        let bannerToShow;
        if (hasValidBanners) {
          bannerToShow = flattenedRows
            .filter(banner => banner !== null && banner !== undefined && banner !== '')
            .map(banner => {
              if (typeof banner === 'string' && banner.includes(',')) {
                return banner.split(',')[0].trim();
              }
              return banner;
            });
        } else {
          bannerToShow = defaultBanner;
          let mixPanelBody: any = {};
          mixPanelBody.eventName = EMixedPanelEvents.default_fallback_banner;
          mixPanelBody.distinctId = userId;
          mixPanelBody.properties = {
            user_id : userId,
            skill_id : skillId,
          };
          await this.helperService.mixPanel(mixPanelBody);
        }
        return {
          bannerToShow: bannerToShow,
        };
      } catch (apiError) {
        // If API call fails, try to refresh session and retry once
        if (
          apiError.response?.status === 401 ||
          apiError.response?.status === 403
        ) {
          metabaseSession = await this.refreshMetabaseSession();
          let defaultBannerId = await this.getSystemConfigByKeyCached(
            EMetabaseUrlLimit.default_banner
          );
          // Update headers with new session
          headers["X-Metabase-Session"] = metabaseSession;
          // Retry the API call
          const retryResponse = await this.http_service
            .post(fullUrl, requestBody, {
              headers,
              timeout: 5000,
              httpAgent: this.httpAgent,
              httpsAgent: this.httpsAgent,
            })
            .toPromise();

          let defaultBanner;

          // Find matching banner based on skillId and skillType
          if (defaultBannerId?.value && Array.isArray(defaultBannerId.value)) {
            const matchingBanner = defaultBannerId.value.find(
              (banner) =>
                banner.sourceId.toString() === skillId.toString() &&
                banner.sourceType === skillType
            );
            if (matchingBanner) {
              defaultBanner = matchingBanner.bannerId;
              // console.log("defaultBanner",defaultBanner);
            }
          }
          const flattenedRows = retryResponse.data?.data?.rows?.flat() || [];
          const hasValidBanners = flattenedRows && flattenedRows.length > 0 && flattenedRows.some(banner => banner !== null);
          let bannerToShow;
          if (hasValidBanners) {
            bannerToShow = flattenedRows
              .filter(banner => banner !== null && banner !== undefined && banner !== '')
              .map(banner => {
                if (typeof banner === 'string' && banner.includes(',')) {
                  return banner.split(',')[0].trim();
                }
                return banner;
              });
          } else {
            // console.log("defaultBanner",defaultBanner);
            bannerToShow = defaultBanner;
            let mixPanelBody: any = {};
            mixPanelBody.eventName = EMixedPanelEvents.default_fallback_banner;
            mixPanelBody.distinctId = userId;
            mixPanelBody.properties = {
              user_id : userId,
              skill_id : skillId,
            };
            await this.helperService.mixPanel(mixPanelBody);
          }
          return {
            bannerToShow: bannerToShow,
          };
        }
        throw apiError;
      }
    } catch (err) {
      let defaultBannerId = await this.getSystemConfigByKeyCached(
        EMetabaseUrlLimit.default_banner
      );
      let defaultBanner;
      // Find matching banner based on skillId and skillType
      if (defaultBannerId?.value && Array.isArray(defaultBannerId.value)) {
        const matchingBanner = defaultBannerId.value.find(
          (banner) =>
            banner.sourceId.toString() === skillId &&
            banner.sourceType === skillType
        );
        if (matchingBanner) {
          defaultBanner = matchingBanner.bannerId;
          let mixPanelBody: any = {};
          mixPanelBody.eventName = EMixedPanelEvents.default_fallback_banner;
          mixPanelBody.distinctId = userId;
          mixPanelBody.properties = {
            user_id : userId,
            skill_id : skillId,
          };
          await this.helperService.mixPanel(mixPanelBody);
        }
      }
      // Return default banner in case of error
      return {
        bannerToShow: defaultBanner,
      };
    }
  }
  async getItemIdFromMetaBase(userId: string, itemId: string, type: ERecommendationListType) {
    try {
      const metabaseBaseUrl = this.configService.get("METABASE_BASE_URL");
      // if (!metabaseBaseUrl) {
      // throw new Error("METABASE_BASE_URL environment variable is not set");
      // }
      const requestBody = {
        parameters: [
          {
            type: "text",
            target: ["variable", ["template-tag", "userid"]],
            value: userId,
          },
          {
            type: "text",
            target: ["variable", ["template-tag", "itemid"]],
            value: itemId,
          },
        ],
      };
      let metabaseSession = await this.getMetabaseSession();
      const headers = {
        "Content-Type": "application/json",
        "X-Metabase-Session": metabaseSession,
      };
      
      const systemConfig = await this.helperService.getSystemConfigByKey(EMetabaseUrlLimit.recommendation_list_card_id);
      const cardConfigs = systemConfig?.value || [];

      const cardConfig = cardConfigs.find((config: any) => config?.type === type);

      try {
        const response = await this.http_service
          .post(`${metabaseBaseUrl}/api/card/532/query`, requestBody, {
            headers,
          })
          .toPromise();
          const result = response.data?.data?.rows.flat() || [];
          if (!result || result.length === 0) {
            const defaultItemId = await this.serviceItemService.defaultRecommendationItemId(userId, itemId, type);
            return defaultItemId || [];
          }
          return result;
      } catch (error) {
       let defaultItemId = await this.serviceItemService.defaultRecommendationItemId(userId,itemId,type);
       return defaultItemId;
      }
    } catch (error) {
      let defaultItemId = await this.serviceItemService.defaultRecommendationItemId(userId,itemId,type);
      return defaultItemId;
    }
  }
}
