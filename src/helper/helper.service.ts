import { HttpService } from "@nestjs/axios";
import {
  BadRequestException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Req,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { catchError, lastValueFrom, map } from "rxjs";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { SharedService } from "src/shared/shared.service";
import { getServiceRequestRatingsDto } from "./dto/getServicerequestRatings.dto";
import { GetBannerDto, BannerResponseDto } from "./dto/getBanner.dto";
import { RedisService } from "src/redis/redis.service";
import { MixpanelExportService } from "./mixpanel-export.service";
import { EMetabaseUrlLimit, EMixedPanelEvents } from "./enums/mixedPanel.enums";
import * as http from "http";
import * as https from "https";
import { ERecommendationListType } from "src/item/enum/serviceItem.type.enum";
import { ServiceItemService } from "src/item/service-item.service";
@Injectable()
export class HelperService {
  constructor(
    private http_service: HttpService,
    private configService: ConfigService,
    private sharedService: SharedService,
    // @Inject(forwardRef(() => RedisService))
    private readonly redisService: RedisService,
    private mixpanelExportService: MixpanelExportService,
    @Inject(forwardRef(() => ServiceItemService))
    private serviceItemService: ServiceItemService
  ) {}
  private httpAgent = new http.Agent({ keepAlive: true, maxSockets: 50 });
  private httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 50 });

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
    const fresh = await this.getSystemConfigByKey(key);
    try {
      await client?.setEx(cacheKey, ttlSeconds, JSON.stringify(fresh));
    } catch (e) {}
    return fresh;
  }
  getRequiredHeaders(@Req() req) {
    const reqHeaders = {
      Authorization: "",
    };

    if (req.headers) {
      reqHeaders.Authorization = req.headers["authorization"] ?? "";
    }

    return reqHeaders;
  }

  async getProfileByIdTl(userId: string[], type?: string) {
    try {
      let data = await this.http_service
        .post(
          `${this.configService.get("CASTTREE_BASE_URL")}/profile/tl/get-profile-list`,
          //   `http://localhost:3000/casttree/profile/tl/get-profile-list`,
          { userIds: userId, type: type }
        )
        .toPromise();

      return data.data.profileData;
    } catch (err) {
      throw err;
    }
  }
  async getProfileById(userId: string[], accessToken: string, type?: string) {
    try {
      let data = await this.http_service
        .post(
          `${this.configService.get("CASTTREE_BASE_URL")}/profile/get-profile-list`,
          //  `http://localhost:3000/casttree/profile/get-profile-list`,
          { userIds: userId, type: type },
          {
            headers: {
              Authorization: accessToken,
            },
          }
        )
        .toPromise();

      return data.data.profileData;
    } catch (err) {
      throw err;
    }
  }
  async getUserByUserId(accessToken: string) {
    try {
      let data = await this.http_service
        .get(
          `${this.configService.get("CASTTREE_BASE_URL")}/user`,
          //  `http://localhost:3000/casttree/profile/get-profile-list`,
          {
            headers: {
              Authorization: accessToken,
            },
          }
        )
        .toPromise();

      return data.data;
    } catch (err) {
      throw err;
    }
  }
  async getCurrencyId(currency, skip = 0, limit = 1) {
    try {
      let data = await this.http_service
        .get(
          `${this.configService.get("CASTTREE_BASE_URL")}/currency?search=${currency}&skip=${skip}&limit=${limit}`
          // `http://localhost:3000/casttree/currency?search=${currency}&skip=${skip}&limit=${limit}`,
        )
        .toPromise();
      // console.log("currency data",data.data);

      return data.data;
    } catch (err) {
      throw err;
    }
  }
  async getUserById(user_id) {
    try {
      let data = await this.http_service
        .post(
          `${this.configService.get("CASTTREE_BASE_URL")}/user/get-user-detail`,
          { user_id: user_id }
        )
        .toPromise();
      return data;
    } catch (err) {
      throw err;
    }
  }

  async updateUserIpById(country_code, user_id) {
    try {
      let data = await this.http_service
        .patch(
          `${this.configService.get("CASTTREE_BASE_URL")}/user/${user_id}`,
          { userId: user_id, country_code: country_code }
        )
        .toPromise();
      return data;
    } catch (err) {
      throw err;
    }
  }

  async getworkShopProfileById(userId: string[], type?: string) {
    try {
      let data = await this.http_service
        .post(
          `${this.configService.get("CASTTREE_BASE_URL")}/profile/workShop/get-profile-list`,
          //   `http://localhost:3000/casttree/profile/workShop/get-profile-list`,
          { userIds: userId, type: type }
        )
        .toPromise();

      return data.data.profileData;
    } catch (err) {
      throw err;
    }
  }

  async getRatings(sourceId: string[], sourceType: string) {
    try {
      let data = await this.http_service
        .post(
          `${this.configService.get("CASTTREE_RATINGS_BASE_URL")}/ratings/get-aggregate-list`,
          // `http://localhost:3200/casttree-ratings/ratings/get-aggregate-list`,
          { sourceIds: sourceId, sourceType: sourceType }
        )
        .toPromise();

      return data.data.ratingData;
    } catch (err) {
      throw err;
    }
  }

  async getRatingsSummary(sourceId: string, sourceType: string) {
    try {
      let data = await this.http_service
        .get(
          `${this.configService.get("CASTTREE_RATINGS_BASE_URL")}/ratings/${sourceType}/${sourceId}/aggregate`
          //  `http://localhost:3200/casttree-ratings/ratings/${sourceType}/${sourceId}/aggregate`,
        )
        .toPromise();

      return data.data;
    } catch (err) {
      throw err;
    }
  }

  async updateNominationStatus(body) {
    try {
      let data = await this.http_service
        .patch(
          `${this.configService.get("CASTTREE_BASE_URL")}/nominations`,
          body,
          {
            headers: {
              Authorization: `${body.token}`,
            },
          }
        )
        .toPromise();
      return data.data;
    } catch (err) {
      throw err;
    }
  }

  async createCouponUsage(body, accessToken: string) {
    try {
      let data = await this.http_service
        .post(
          `${this.configService.get("CASTTREE_BASE_URL")}/coupon/create-coupon-usage`,
          // `http://localhost:3000/casttree/coupon/create-coupon-usage`,
          body,
          {
            headers: {
              Authorization: accessToken,
            },
          }
        )
        .toPromise();
      return data.data;
    } catch (err) {
      throw err;
    }
  }

  async sendMail(body) {
    try {
      let data = await this.http_service
        .post(`https://control.msg91.com/api/v5/email/send`, body, {
          headers: {
            authkey: this.configService.get("MSG91_AUTHKEY"),
            accept: "application/json",
          },
        })
        .toPromise();
      return data.data;
    } catch (err) {
      throw err;
    }
  }

  async trackEvent(body) {
    try {
      let data = await this.http_service
        .post(
          `${this.configService.get("CASTTREE_BASE_URL")}/mixpanel/track-event`,
          body
        )
        .toPromise();
      return data.data;
    } catch (err) {
      throw err;
    }
  }

  async sendWhastappMessage(body) {
    try {
      let data = await this.http_service
        .post(
          `https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/`,
          body,
          {
            headers: {
              authkey: this.configService.get("MSG91_AUTHKEY"),
              accept: "application/json",
            },
          }
        )
        .toPromise();
      return data.data;
    } catch (err) {
      throw err;
    }
  }

  async getServiceRequestRatings(body: getServiceRequestRatingsDto) {
    try {
      let data = await this.http_service
        .post(
          `${this.configService.get("CASTTREE_RATINGS_BASE_URL")}/ratings/get-serviceRequest-ratings`,
          //`http://localhost:3200/casttree-ratings/ratings/get-serviceRequest-ratings`,
          body
        )
        .toPromise();
      return data.data;
    } catch (err) {
      throw err;
    }
  }

  async getCountryCodeByLatAndLong(latitude: string, longitude: string) {
    try {
      const response = await this.http_service
        .get(
          `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}&api_key=${process.env.GEOCODE_API_KEY}`
        )
        .toPromise();
      return response.data["address"]["country_code"].toUpperCase();
    } catch (error) {
      throw error;
    }
  }

  async getCountryCodeByIpAddress(ipAddress: string) {
    try {
      const response = await this.http_service
        .get(
          `https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.IP_API_KEY}&ip=${ipAddress}`
        )
        .toPromise();
      return response.data;
    } catch (error) {
      return error;
    }
  }

  async addSubscription(body) {
    try {
      // console.log("addSubscription body is", body);
      let fv = {
        amount: body?.amount,
        currency: body?.currency,
        customer_id: body?.customer_id,
        method: "upi",
        payment_capture: 1,
        token: {
          max_amount: body?.token.max_amount,
          expire_at: body?.token.expire_at,
        },
      };
      // console.log("razorpay order creation fv", fv);

      let razor_pay_key = this.configService.get("RAZORPAY_API_KEY");
      let razor_pay_secret = this.configService.get("RAZORPAY_SECRET_KEY");
      let data = await this.http_service
        .post(`${this.configService.get("RAZORPAY_BASE_URL")}/v1/orders`, fv, {
          auth: {
            username: razor_pay_key,
            password: razor_pay_secret,
          },
        })
        .toPromise();
      // console.log("response data is ==>", data.data);

      return data.data;
    } catch (err) {
      throw err;
    }
  }

  async createRecurringPayment(body) {
    try {
      let fv = {
        email: body?.email,
        contact: body?.contact,
        amount: body.amount,
        currency: body.currency,
        order_id: body.order_id,
        customer_id: body.customer_id,
        token: body.token,
        recurring: "1",
        notes: {
          userId: body?.notes?.userId,
          userReferenceId: body?.notes?.userReferenceId,
          razorpayOrderId: body?.notes?.razorpayOrderId,
        },
      };

      // console.log("recurring payment body is", fv);
      let razor_pay_key = this.configService.get("RAZORPAY_API_KEY");
      let razor_pay_secret = this.configService.get("RAZORPAY_SECRET_KEY");
      let data = await this.http_service
        .post(
          `${this.configService.get("RAZORPAY_BASE_URL")}/v1/payments/create/recurring`,
          fv,
          {
            auth: {
              username: razor_pay_key,
              password: razor_pay_secret,
            },
          }
        )
        .toPromise();
      // console.log("recurring data is ==>", data.data);

      return data.data;
    } catch (err) {
      throw err;
    }
  }

  async createCustomer(body, token: any) {
    try {
      let name = body.userName?.trim();

      if (!name || name.length < 3) {
        name = "Creedom User";
      }
      // console.log("name is",name);

      let fv = {
        name: name,
        email: body.email,
        contact: body.phoneNumber,
        fail_existing: "0",
      };
      // console.log("customer fv", fv);

      let razor_pay_key = this.configService.get("RAZORPAY_API_KEY");
      let razor_pay_secret = this.configService.get("RAZORPAY_SECRET_KEY");
      let data = await this.http_service
        .post(
          `${this.configService.get("RAZORPAY_BASE_URL")}/v1/customers`,
          fv,
          {
            auth: {
              username: razor_pay_key,
              password: razor_pay_secret,
            },
          }
        )
        .toPromise();

      return data.data;
    } catch (err) {
      throw err;
    }
  }

  async updateUser(body: any) {
    try {
      let data = await this.http_service
        .patch(
          `${this.configService.get("CASTTREE_BASE_URL")}/user/${body.userId}`,
          // `http://localhost:3000/casttree/user/${body.userId}`,
          body
        )
        .toPromise();

      return JSON.stringify(data.data);
    } catch (err) {
      throw err;
    }
  }
  async updateUsers(body: any) {
    try {
      let data = await this.http_service
        .patch(
          `${this.configService.get("CASTTREE_BASE_URL")}/user/remove-membership`,
          // `http://localhost:3000/casttree/user/remove-membership`,

          body
        )
        .toPromise();

      return JSON.stringify(data.data);
    } catch (err) {
      throw err;
    }
  }

  async createAuth(body) {
    try {
      //console.log("auth body is", body);

      const requestURL = `${this.configService.get("CASHFREE_BASE_URL")}/pg/subscriptions/pay`;
      const headers = {
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json",
        "x-client-id": this.configService.get("CASHFREE_CLIENT_ID"),
        "x-client-secret": this.configService.get("CASHFREE_CLIENT_SECRET"),
      };
      const request = this.http_service
        .post(requestURL, body, { headers: headers })
        .pipe(
          map((res) => {
            //console.log(res?.data);
            return res?.data;
          })
        )
        .pipe(
          catchError((err) => {
            //console.log(err);
            throw new BadRequestException("API not available");
          })
        );

      const response = await lastValueFrom(request);
      return response;
    } catch (err) {
      throw err;
    }
  }

  async getPlanDetails(planId: string) {
    try {
      const requestURL = `${this.configService.get("CASHFREE_BASE_URL")}/pg/plans/${planId}`;

      const headers = {
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json",
        "x-client-id": this.configService.get("CASHFREE_CLIENT_ID"),
        "x-client-secret": this.configService.get("CASHFREE_CLIENT_SECRET"),
      };
      const request = this.http_service
        .get(requestURL, { headers: headers })
        .pipe(
          map((res) => {
            // console.log(res?.data);
            return res?.data;
          })
        )
        .pipe(
          catchError((err) => {
            // console.log(err);
            throw new BadRequestException("API not available");
          })
        );

      const response = await lastValueFrom(request);
      return response;
    } catch (err) {
      throw err;
    }
  }

  async createSubscription(body, token) {
    try {
      // console.log("subscription body is", body);
      const requestURL = `${this.configService.get("CASHFREE_BASE_URL")}/pg/subscriptions`;

      const headers = {
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json",
        "x-client-id": this.configService.get("CASHFREE_CLIENT_ID"),
        "x-client-secret": this.configService.get("CASHFREE_CLIENT_SECRET"),
      };
      delete body.subscription_first_charge_time;
      const request = this.http_service
        .post(requestURL, body, { headers: headers })
        .pipe(
          map((res) => {
            // console.log(res?.data);
            return res?.data;
          })
        )
        .pipe(
          catchError((err) => {
            //  console.log(err);
            throw new BadRequestException("API not available");
          })
        );

      const response = await lastValueFrom(request);
      return response;
    } catch (err) {
      throw err;
    }
  }

  async createPhonepeAuth() {
    try {
      const requestURL = `${this.configService.get("PHONEPE_BASE_URL")}/apis/pg-sandbox/v1/oauth/token`;
      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
      };
      let body = {
        client_id: this.configService.get("PHONEPE_CLIENT_ID"),
        client_version: this.configService.get("PHONEPE_CLIENT_VERSION"),
        client_secret: this.configService.get("PHONEPE_CLIENT_SECRET"),
        grant_type: "client_credentials",
      };
      const request = this.http_service
        .post(requestURL,body, { headers: headers })
        .pipe(
          map((res) => {
            //console.log(res?.data);
            return res?.data;
          })
        )
        .pipe(
          catchError((err) => {
            console.log("auth err is", err);
            throw new BadRequestException("API not available");
          })
        );

      const response = await lastValueFrom(request);
      return response;
    } catch (err) {
      throw err;
    }
  }

  async createPhonepeSubscription(token, body) {
    try {
      const requestURL = `${this.configService.get("PHONEPE_BASE_URL")}/apis/pg-sandbox/subscriptions/v2/setup`;
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `O-Bearer ${token}`,
      };
      const request = this.http_service
        .post(requestURL, body, { headers: headers })
        .pipe(
          map((res) => {
            //console.log(res?.data);
            return res?.data;
          })
        )
        .pipe(
          catchError((err) => {
            console.log("err", err);
            throw new BadRequestException("API not available");
          })
        );

      const response = await lastValueFrom(request);
      return response;
    } catch (err) {
      throw err;
    }
  }

  async notifyPhonepeSubscription(token, body) {
    try {
      const requestURL = `${this.configService.get("PHONEPE_BASE_URL")}/apis/pg-sandbox/subscriptions/v2/notify`;
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `O-Bearer ${token}`,
      };
      const request = this.http_service
        .post(requestURL, body, { headers: headers })
        .pipe(
          map((res) => {
            //console.log(res?.data);
            return res?.data;
          })
        )
        .pipe(
          catchError((err) => {
            console.log("notify err", err);
            throw new BadRequestException("API not available");
          })
        );

      const response = await lastValueFrom(request);
      return response;
    } catch (err) {
      throw err;
    }
  }

  async redeemPhonepeSubscription(token, body) {
    try {
      const requestURL = `${this.configService.get("PHONEPE_BASE_URL")}/apis/pg-sandbox/subscriptions/v2/redeem`;
      const headers = {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${token}`,
      };
      const request = this.http_service
        .post(requestURL, body, { headers: headers })
        .pipe(
          map((res) => {
            //console.log(res?.data);
            return res?.data;
          })
        )
        .pipe(
          catchError((err) => {
            console.log("redeem err", err);
            throw new BadRequestException("API not available");
          })
        );

      const response = await lastValueFrom(request);
      return response;
    } catch (err) {
      throw err;
    }
  }

  async getUserAdditionalDetails(body) {
    try {
      // console.log("getUserAdditionalDetails body is", body);

      const requestURL = `${this.configService.get("CASTTREE_BASE_URL")}/user/get-user-additional/${body.userId}`;
      const request = this.http_service
        .get(requestURL, body)
        .pipe(
          map((res) => {
            // console.log(res?.data);
            return res?.data;
          })
        )
        .pipe(
          catchError((err) => {
            console.log(err);
            throw new BadRequestException("API not available");
          })
        );

      const response = await lastValueFrom(request);
      return response;
    } catch (err) {
      throw err;
    }
  }
  async updateUserPurchaseCoin(body) {
    try {
      // console.log("getUserAdditionalDetails body is", body);

      const requestURL = `${this.configService.get("CASTTREE_BASE_URL")}/user/update-purchased-balance/${body.userId}`;
      // `http://localhost:3000/casttree/user/update-purchased-balance/${body.userId}`;
      const request = this.http_service
        .patch(requestURL, body)
        .pipe(
          map((res) => {
            // console.log(res?.data);
            return res?.data;
          })
        )
        .pipe(
          catchError((err) => {
            // console.log(err);
            throw new BadRequestException("API not available");
          })
        );

      const response = await lastValueFrom(request);
      return response;
    } catch (err) {
      throw err;
    }
  }

  async updateUserAdditional(body) {
    try {
      // console.log("inisde update user additional", body);

      const requestURL = `${this.configService.get("CASTTREE_BASE_URL")}/user/update-user-additional/${body.userId}`;
      // `http://localhost:3000/casttree/user/update-user-additional/${body.userId}`;
      const request = this.http_service
        .patch(requestURL, body)
        .pipe(
          map((res) => {
            console.log(res?.data);
            return res?.data;
          })
        )
        .pipe(
          catchError((err) => {
            console.log(err);
            throw new BadRequestException("API not available");
          })
        );

      const response = await lastValueFrom(request);
      // console.log("response", response);

      return response;
    } catch (err) {
      throw err;
    }
  }

  async mixPanel(body: any) {
    try {
      let data = await this.http_service
        .post(
          `${this.configService.get("CASTTREE_BASE_URL")}/mixpanel/track-event`,
          //  `http://localhost:3000/casttree/mixpanel/track-event`,
          body
        )
        .toPromise();
      return JSON.stringify(data.data);
    } catch (err) {
      throw err;
    }
  }
  async getConversionRate(
    fromCurrency: string,
    amount: number
  ): Promise<number> {
    try {
      const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
      let toCurrency = "INR";
      const url = `${process.env.CURRENCY_API}/${API_KEY}/pair/${fromCurrency}/${toCurrency}/${amount}`;
      const response = await axios.get(url);
      // console.log("API Response:", response.data);
      const conversionRate = response.data?.conversion_rate;
      // console.log(
      //  `Conversion rate from ${fromCurrency} to ${toCurrency} amount ${amount} is ${conversionRate}`
      //   );
      return conversionRate;
    } catch (error: any) {
      console.error("Failed to fetch conversion rate:", error.message);
      return null;
    }
  }
  async cancelRazorpaySubscription(customerId: string, tokenId: string) {
    try {
      // console.log("customer id is", customerId, typeof customerId);
      // console.log("tokenId  is", tokenId, typeof tokenId);

      const razorpayKey = this.configService.get<string>("RAZORPAY_API_KEY");
      const razorpaySecret = this.configService.get<string>(
        "RAZORPAY_SECRET_KEY"
      );
      const baseUrl = this.configService.get<string>("RAZORPAY_BASE_URL");

      const url = `${baseUrl}/v1/customers/${customerId}/tokens/${tokenId}/cancel`;

      const data = await this.http_service
        .put(url, null, {
          auth: {
            username: razorpayKey,
            password: razorpaySecret,
          },
        })
        .toPromise();
      // console.log("response data is ==>", data);

      return data;
    } catch (err) {
      const statusCode =
        err?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      let message =
        err?.response?.data?.error?.description ||
        err?.message ||
        "Razorpay cancellation failed";
      throw new HttpException(
        {
          code: err?.response?.status,
          message,
        },
        statusCode
      );
    }
  }
  async cancelSubscription(subReferenceId: string) {
    try {
      const requestURL = `${this.configService.get("CASHFREE_BASE_URL")}/pg/subscriptions/${subReferenceId}/manage`;

      const headers = {
        "x-api-version": "2025-01-01",
        "Content-Type": "application/json",
        "X-Client-Id": this.configService.get("CASHFREE_CLIENT_ID"),
        "X-Client-Secret": this.configService.get("CASHFREE_CLIENT_SECRET"),
      };

      const requestBody = { subscription_id: subReferenceId, action: "CANCEL" };
      // console.log("requestBody", requestBody);

      const response = await lastValueFrom(
        this.http_service.post(requestURL, requestBody, { headers }).pipe(
          map((res) => res?.data),
          catchError((err) => {
            throw new BadRequestException(
              `Failed to cancel subscription: ${err.response?.data?.message || err.message}`
            );
          })
        )
      );
      return response;
    } catch (err) {
      // console.error("Final Catch Error:", err);
      throw new BadRequestException(
        "Unexpected error while canceling subscription"
      );
    }
  }

  async updateCharge(body) {
    try {
      const requestURL = `${this.configService.get("CASHFREE_BASE_URL")}/pg/subscriptions/${body.subscriptionId}/payments/${body.paymentId}/manage`;
      const headers = {
        "x-api-version": "2025-01-01",
        "Content-Type": "application/json",
        "x-client-id": this.configService.get("CASHFREE_CLIENT_ID"),
        "x-client-secret": this.configService.get("CASHFREE_CLIENT_SECRET"),
      };
      const request = this.http_service
        .post(
          requestURL,
          {
            payment_id: body.paymentId,
            action: "RETRY",
            action_details: {
              next_scheduled_time: body.nextSchedule,
            },
          },
          { headers: headers }
        )
        .pipe(
          map((res) => {
            //  console.log(res?.data);
            return res?.data;
          })
        )
        .pipe(
          catchError((err) => {
            //  console.log(err);
            throw new BadRequestException("API not available");
          })
        );

      const response = await lastValueFrom(request);
      return response;
    } catch (err) {
      throw err;
    }
  }

  // async facebookEvents(phoneNumber, currency, amount) {
  //   try {
  //     let hashedPhoneNumber = await this.sha256(phoneNumber);
  //     let data = await this.http_service
  //       .post(`${this.configService.get("FACEBOOK_EVENT_URL")}`, {
  //         data: [
  //           {
  //             event_name: "Purchase",
  //             event_time: Math.floor(Date.now() / 1000),
  //             action_source: "website",
  //             event_id: Math.floor(1000000000 + Math.random() * 9000000000),
  //             attribution_data: {
  //               attribution_share: "0.3",
  //             },
  //             original_event_data: {
  //               event_name: "Purchase",
  //               event_time: Math.floor(Date.now() / 1000),
  //             },
  //             user_data: {
  //               ph: hashedPhoneNumber,
  //             },
  //             custom_data: {
  //               currency: currency,
  //               value: amount,
  //             },
  //           },
  //         ],
  //         access_token: this.configService.get("FACEBOOK_ACCESS_TOKEN"),
  //       })
  //       .toPromise();
  //     return data.data;
  //   } catch (err) {
  //     throw err;
  //   }
  // }

  async sha256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  }

  async getSystemConfig(contestId: string) {
    try {
      let data = await this.http_service
        .get(
          `${this.configService.get("CASTTREE_BASE_URL")}/configuration/contestId?contestId=${contestId}`
          //  `http://localhost:3000/casttree/configuration/contestId?contestId=${itemId}`,
        )
        .toPromise();
      return data.data;
    } catch (err) {
      throw err;
    }
  }
  async getSystemConfigByKey(key: string) {
    try {
      let data = await this.http_service
        .get(
          `${this.configService.get("CASTTREE_BASE_URL")}/configuration?key=${key}`
        )
        .toPromise();
      return data.data;
    } catch (err) {
      throw err;
    }
  }
  async getAward(itemId: string) {
    try {
      let data = await this.http_service
        .get(
          `${this.configService.get("CASTTREE_BASE_URL")}/awards/get-awards-itemId?itemId=${itemId}`
          // `http://localhost:3000/casttree/awards/get-awards-itemId?itemId=${itemId}`
        )
        .toPromise();
      // console.log("data",data.data);
      return data.data;
    } catch (err) {
      throw err;
    }
  }
  async getNominations(id: string, skip: number, limit: number) {
    try {
      let data = await this.http_service
        .get(
          `${this.configService.get("CASTTREE_BASE_URL")}/nominations/award/${id}?skip=${skip}&limit=${limit}`
          // `http://localhost:3000/casttree/nominations/award/${id}`
        )
        .toPromise();
      // console.log("getNominations",data.data);
      return data.data;
    } catch (err) {
      throw err;
    }
  }
  async getUserApplication(awardId: string, rawToken) {
    try {
      let data = await this.http_service
        .get(
          `${this.configService.get("CASTTREE_BASE_URL")}/application/get-user-application/${awardId}`,
          {
            headers: {
              Authorization: `${rawToken}`,
            },
          }
        )
        .toPromise();
      return data.data;
    } catch (err) {
      // console.log("err is", err);

      throw err;
    }
  }
  async updateAdminCoinValue(body) {
    try {
      // console.log("getUserAdditionalDetails body is", body);

      const requestURL = `${this.configService.get("CASTTREE_BASE_URL")}/user/update-admin-additional/${body.userId}`;
      // `http://localhost:3000/casttree/user/update-admin-additional/${body.userId}`;
      const request = this.http_service
        .patch(requestURL, body)
        .pipe(
          map((res) => {
            // console.log(res?.data);
            return res?.data;
          })
        )
        .pipe(
          catchError((err) => {
            // console.log(err);
            throw new BadRequestException("API not available");
          })
        );

      const response = await lastValueFrom(request);
      return response;
    } catch (err) {
      throw err;
    }
  }
  async updateReferral(body: any) {
    try {
      const requestURL = `${this.configService.get("CASTTREE_BASE_URL")}/referral/${body.referralId}`;
      // `http://localhost:3000/casttree/referral/${body.referralId}`;
      const request = this.http_service
        .patch(requestURL, body)
        .pipe(
          map((res) => {
            // console.log(res?.data);
            return res?.data;
          })
        )
        .pipe(
          catchError((err) => {
            // console.log(err);
            throw new BadRequestException("API not available");
          })
        );

      const response = await lastValueFrom(request);
      return response;
    } catch (error) {
      throw error;
    }
  }
  async createReferralTransaction(body: any) {
    try {
      const requestURL = `${this.configService.get("CASTTREE_BASE_URL")}/referral/transaction`;
      // const requestURL = `http://localhost:3000/casttree/referral/transaction`;
      const request = this.http_service.post(requestURL, body).pipe(
        map((res) => {
          // console.log(res?.data);
          return res?.data;
        })
      );
      const response = await lastValueFrom(request);
      return response;
    } catch (error) {
      throw error;
    }
  }
  async getUserAdditional(userId: string) {
    try {
      let data = await this.http_service
        .get(
          `${this.configService.get("CASTTREE_BASE_URL")}/user/user-additional-detail/${userId}`
          // `http://localhost:3000/casttree/user/user-additional-detail/${userId}`,
        )
        .toPromise();
      return data.data;
    } catch (err) {
      // console.log("err is", err);
      throw err;
    }
  }
  async getReferralData(refereeUserId: string, referrerId: string) {
    try {
      let data = await this.http_service
        .get(
          `${this.configService.get("CASTTREE_BASE_URL")}/referral/${refereeUserId}/${referrerId}`
          // `http://localhost:3000/casttree/referral/${refereeUserId}/${referrerId}`,
        )
        .toPromise();
      return data.data;
    } catch (error) {
      throw error;
    }
  }
  // @OnEvent(EVENT_UPDATE_USER)
  // async updateUserDetails(updateUserPayload: IUserUpdateEvent): Promise<any> {
  //   try {
  //     console.log("updateUserPayload", updateUserPayload);

  //     await this.sharedService.updateEventProcessingStatus(
  //       updateUserPayload?.commandSource,
  //       ECommandProcessingStatus.InProgress
  //     );
  //     let user = await this.updateUser(updateUserPayload);
  //     console.log("user", user);

  //     await this.sharedService.updateEventProcessingStatus(
  //       updateUserPayload?.commandSource,
  //       ECommandProcessingStatus.Complete
  //     );
  //   } catch (err) {
  //     console.error("err", err);
  //     await this.sharedService.updateEventProcessingStatus(
  //       updateUserPayload?.commandSource,
  //       ECommandProcessingStatus.Failed
  //     );
  //   }
  // }

  async fetchMixpanelData(
    fromDate?: string,
    toDate?: string,
    event?: string,
    limit?: number
  ): Promise<string> {
    try {
      console.log("inside mixpanel event");

      const mixpanelApiSecret = this.configService.get("MIXPANEL_API_SECRET");

      if (!mixpanelApiSecret) {
        throw new Error("MIXPANEL_API_SECRET environment variable is not set");
      }

      // Use default date range if not provided
      const dateRange = this.mixpanelExportService.getDefaultDateRange();
      const from = fromDate || dateRange.fromDate;
      const to = toDate || dateRange.toDate;

      const params: any = {
        from_date: from,
        to_date: to,
      };

      // Add event filter if provided
      if (event) {
        params.event = `["${event}"]`;
      }
      if (limit) {
        params.limit = limit;
      } else {
        // Set a default limit to prevent memory issues
        params.limit = 10000;
      }

      // Use streaming response to handle large datasets
      const response = await axios.get(
        "https://data.mixpanel.com/api/2.0/export",
        {
          auth: {
            username: mixpanelApiSecret,
            password: "",
          },
          params,
          responseType: "stream", // Use stream to handle large responses
          timeout: 300000, // 5 minutes timeout for large datasets
        }
      );

      // Process the stream line by line with a size limit
      return new Promise((resolve, reject) => {
        let data = "";
        let buffer = "";
        let lineCount = 0;
        const maxLines = limit || 10000;

        response.data.on("data", (chunk: Buffer) => {
          buffer += chunk.toString("utf8");
          const lines = buffer.split("\n");

          // Keep the last incomplete line in buffer
          buffer = lines.pop() || "";

          // Process complete lines
          for (const line of lines) {
            if (line.trim()) {
              data += line + "\n";
              lineCount++;

              // Stop processing if we've reached the limit
              if (lineCount >= maxLines) {
                response.data.destroy(); // Stop the stream
                resolve(data);
                return;
              }
            }
          }
        });

        response.data.on("end", () => {
          try {
            // Process any remaining data in buffer
            if (buffer.trim()) {
              data += buffer + "\n";
            }
            resolve(data);
          } catch (error) {
            reject(
              new Error("Failed to process response data: " + error.message)
            );
          }
        });

        response.data.on("error", (error: Error) => {
          reject(new Error("Stream error: " + error.message));
        });
      });
    } catch (error) {
      console.error("Error fetching Mixpanel data:", error);
      throw error;
    }
  }

  async exportMixpanelToCsv(
    fromDate?: string,
    toDate?: string,
    event?: string,
    limit?: number
  ): Promise<string> {
    try {
      // For large datasets, use streaming approach
      console.log("Using streaming approach for CSV export...");
      return await this.streamToCsvString(fromDate, toDate, event, limit);
    } catch (error) {
      console.error("Error exporting Mixpanel data to CSV:", error);
      throw error;
    }
  }
  private async streamToCsvString(
    fromDate?: string,
    toDate?: string,
    event?: string,
    limit?: number
  ): Promise<string> {
    try {
      const mixpanelApiSecret = this.configService.get("MIXPANEL_API_SECRET");

      if (!mixpanelApiSecret) {
        throw new Error("MIXPANEL_API_SECRET environment variable is not set");
      }

      // Use default date range if not provided
      const dateRange = this.mixpanelExportService.getDefaultDateRange();
      const from = fromDate || dateRange.fromDate;
      const to = toDate || dateRange.toDate;

      const params: any = {
        from_date: from,
        to_date: to,
      };

      // Add event filter if provided
      if (event) {
        params.event = `["${event}"]`;
      }
      if (limit) {
        params.limit = limit;
      }

      // Use streaming response
      const response = await axios.get(
        "https://data.mixpanel.com/api/2.0/export",
        {
          auth: {
            username: mixpanelApiSecret,
            password: "",
          },
          params,
          responseType: "stream",
          timeout: 300000, // 5 minutes timeout
        }
      );

      return new Promise((resolve, reject) => {
        let csvData = "";
        let isFirstRow = true;
        let headers: string[] = [];
        let buffer = "";

        response.data.on("data", (chunk: Buffer) => {
          buffer += chunk.toString("utf8");
          const lines = buffer.split("\n");

          // Keep the last incomplete line in buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim()) {
              try {
                const item = JSON.parse(line);
                // Include all properties as JSON string
                const flattened = {
                  event: item.event,
                  time: item.properties?.time,
                  distinct_id: item.properties?.distinct_id,
                  properties: JSON.stringify(item.properties || {}),
                };

                if (isFirstRow) {
                  // Extract headers from first row - this will include all custom properties
                  headers = Object.keys(flattened);
                  csvData += headers.join(",") + "\n";
                  isFirstRow = false;
                }

                // Create CSV row
                const row = headers.map((header) => {
                  const value = flattened[header];
                  if (value === null || value === undefined) {
                    return "";
                  }
                  // Escape CSV values
                  const stringValue = String(value);
                  if (
                    stringValue.includes(",") ||
                    stringValue.includes('"') ||
                    stringValue.includes("\n")
                  ) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                  }
                  return stringValue;
                });

                csvData += row.join(",") + "\n";
              } catch (parseError) {
                console.warn("Skipping invalid JSON line:", parseError.message);
                continue;
              }
            }
          }
        });

        response.data.on("end", () => {
          // Process any remaining data in buffer
          if (buffer.trim()) {
            try {
              const item = JSON.parse(buffer);
              // Include all properties as JSON string
              const flattened = {
                event: item.event,
                time: item.properties?.time,
                distinct_id: item.properties?.distinct_id,
                properties: JSON.stringify(item.properties || {}),
              };

              if (isFirstRow) {
                headers = Object.keys(flattened);
                csvData += headers.join(",") + "\n";
              }

              const row = headers.map((header) => {
                const value = flattened[header];
                if (value === null || value === undefined) {
                  return "";
                }
                const stringValue = String(value);
                if (
                  stringValue.includes(",") ||
                  stringValue.includes('"') ||
                  stringValue.includes("\n")
                ) {
                  return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
              });

              csvData += row.join(",") + "\n";
            } catch (parseError) {
              console.warn(
                "Skipping invalid JSON line in final buffer:",
                parseError.message
              );
            }
          }
          resolve(csvData);
        });

        response.data.on("error", (error: Error) => {
          console.error("Stream error:", error);
          reject(new Error("Stream processing failed: " + error.message));
        });
      });
    } catch (error) {
      console.error("Error streaming to CSV string:", error);
      throw error;
    }
  }

  private async refreshMetabaseSession(): Promise<string> {
    try {
      // Remove old session from Redis
      await this.redisService.getClient()?.del("metabase:session");

      // Create new session
      return await this.createMetabaseSession();
    } catch (error) {
      console.error("Error refreshing Metabase session:", error);
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
      // console.log("requestBody",requestBody)
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

      // console.log("Created new Metabase session:", sessionId);

      // Store session in Redis with 24 hour expiration
      await this.redisService
        .getClient()
        ?.setEx("metabase:session", 86400, sessionId);

      return sessionId;
    } catch (error) {
      console.error("Error creating Metabase session:", error);
      throw new Error(`Failed to create Metabase session: ${error.message}`);
    }
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
      console.error("Error getting Metabase session:", error);
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
      if (!metabaseBaseUrl) {
        throw new Error("METABASE_BASE_URL environment variable is not set");
      }

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
        // console.log("defaultBannerId", defaultBannerId?.value);
        let defaultBanner;
        // Find matching banner based on skillId and skillType
        if (defaultBannerId?.value && Array.isArray(defaultBannerId.value)) {
          const matchingBanner = defaultBannerId.value.find(
            (banner) =>
              banner.sourceId.toString() === skillId.toString() &&
              banner.sourceType === skillType
          );
          // console.log("matchingBanner", matchingBanner);
          if (matchingBanner) {
            defaultBanner = matchingBanner.bannerId;
          }
        }
        const flattenedRows = response.data?.data?.rows?.flat() || [];
        const hasValidBanners =
          flattenedRows &&
          flattenedRows.length > 0 &&
          flattenedRows.some((banner) => banner !== null);

        let bannerToShow;
        if (hasValidBanners) {
          bannerToShow = flattenedRows
            .filter(
              (banner) =>
                banner !== null && banner !== undefined && banner !== ""
            )
            .map((banner) => {
              if (typeof banner === "string" && banner.includes(",")) {
                return banner.split(",")[0].trim();
              }
              return banner;
            });
        } else {
          bannerToShow = defaultBanner;
          let mixPanelBody: any = {};
          mixPanelBody.eventName = EMixedPanelEvents.default_fallback_banner;
          mixPanelBody.distinctId = userId;
          mixPanelBody.properties = {
            user_id: userId,
            skill_id: skillId,
          };
          await this.mixPanel(mixPanelBody);
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
            }
          }
          const flattenedRows = retryResponse.data?.data?.rows?.flat() || [];
          console.log("flattenedRows", flattenedRows);
          const hasValidBanners =
            flattenedRows &&
            flattenedRows.length > 0 &&
            flattenedRows.some((banner) => banner !== null);
          let bannerToShow;
          if (hasValidBanners) {
            bannerToShow = flattenedRows
              .filter(
                (banner) =>
                  banner !== null && banner !== undefined && banner !== ""
              )
              .map((banner) => {
                if (typeof banner === "string" && banner.includes(",")) {
                  return banner.split(",")[0].trim();
                }
                return banner;
              });
          } else {
            bannerToShow = defaultBanner;
            let mixPanelBody: any = {};
            mixPanelBody.eventName = EMixedPanelEvents.default_fallback_banner;
            mixPanelBody.distinctId = userId;
            mixPanelBody.properties = {
              user_id: userId,
              skill_id: skillId,
            };
            await this.mixPanel(mixPanelBody);
          }
          return {
            bannerToShow: bannerToShow,
          };
        }
        throw apiError;
      }
    } catch (err) {
      console.error("Error fetching banner from Metabase:", err);
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
            user_id: userId,
            skill_id: skillId,
          };
          await this.mixPanel(mixPanelBody);
        }
      }
      // Return default banner in case of error
      return {
        bannerToShow: defaultBanner,
      };
    }
  }
  async getItemIdFromMetaBase(
    userId: string,
    itemId: string,
    type: ERecommendationListType
  ) {
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

      const systemConfig = await this.getSystemConfigByKey(
        EMetabaseUrlLimit.recommendation_list_card_id
      );
      const cardConfigs = systemConfig?.value || [];

      const cardConfig = cardConfigs.find(
        (config: any) => config?.type === type
      );

      try {
        const response = await this.http_service
          .post(
            `${metabaseBaseUrl}/api/card/${cardConfig.card}/query`,
            requestBody,
            {
              headers,
            }
          )
          .toPromise();
        const result = response.data?.data?.rows.flat() || [];
        if (!result || result.length === 0) {
          const defaultItemId =
            await this.serviceItemService.defaultRecommendationItemId(
              userId,
              itemId,
              type
            );
          return defaultItemId || [];
        }
        return result;
      } catch (error) {
        let defaultItemId =
          await this.serviceItemService.defaultRecommendationItemId(
            userId,
            itemId,
            type
          );
        return defaultItemId;
      }
    } catch (error) {
      let defaultItemId =
        await this.serviceItemService.defaultRecommendationItemId(
          userId,
          itemId,
          type
        );
      return defaultItemId;
    }
  }
  private async processLargeDatasetToCsv(jsonlData: string): Promise<string> {
    try {
      const lines = jsonlData.trim().split("\n");
      const csvRows: string[] = [];
      let headers: string[] = [];
      let isFirstRow = true;

      // Process in chunks to avoid memory issues
      const chunkSize = 1000; // Process 1000 lines at a time

      for (let i = 0; i < lines.length; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize);

        for (const line of chunk) {
          try {
            const item = JSON.parse(line);
            // Flatten all properties including custom ones using the utility function
            const baseProperties = {
              event: item.event,
              time: item.properties?.time,
              distinct_id: item.properties?.distinct_id,
            };

            // Include all properties as JSON string
            const flattened = {
              event: item.event,
              time: item.properties?.time,
              distinct_id: item.properties?.distinct_id,
              properties: JSON.stringify(item.properties || {}),
            };

            if (isFirstRow) {
              // Extract headers from first row - this will include all custom properties
              headers = Object.keys(flattened);
              csvRows.push(headers.join(","));
              isFirstRow = false;
            }

            // Create CSV row
            const row = headers.map((header) => {
              const value = flattened[header];
              if (value === null || value === undefined) {
                return "";
              }
              // Escape CSV values
              const stringValue = String(value);
              if (
                stringValue.includes(",") ||
                stringValue.includes('"') ||
                stringValue.includes("\n")
              ) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            });

            csvRows.push(row.join(","));
          } catch (parseError) {
            console.warn("Skipping invalid JSON line:", parseError.message);
            continue;
          }
        }
      }

      return csvRows.join("\n");
    } catch (error) {
      console.error("Error processing large dataset:", error);
      throw new Error("Failed to process large dataset: " + error.message);
    }
  }

  async streamMixpanelToCsv(
    fromDate?: string,
    toDate?: string,
    event?: string,
    limit?: number,
    res?: any
  ): Promise<void> {
    try {
      const mixpanelApiSecret = this.configService.get("MIXPANEL_API_SECRET");

      if (!mixpanelApiSecret) {
        throw new Error("MIXPANEL_API_SECRET environment variable is not set");
      }

      // Use default date range if not provided
      const dateRange = this.mixpanelExportService.getDefaultDateRange();
      const from = fromDate || dateRange.fromDate;
      const to = toDate || dateRange.toDate;

      const params: any = {
        from_date: from,
        to_date: to,
      };

      // Add event filter if provided
      if (event) {
        params.event = `["${event}"]`;
      }
      if (limit) {
        params.limit = limit;
      }

      // Use streaming response
      const response = await axios.get(
        "https://data.mixpanel.com/api/2.0/export",
        {
          auth: {
            username: mixpanelApiSecret,
            password: "",
          },
          params,
          responseType: "stream",
          timeout: 300000, // 5 minutes timeout
        }
      );

      let isFirstRow = true;
      let headers: string[] = [];
      let buffer = "";

      response.data.on("data", (chunk: Buffer) => {
        buffer += chunk.toString("utf8");
        const lines = buffer.split("\n");

        // Keep the last incomplete line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            try {
              const item = JSON.parse(line);
              // Include all properties as JSON string
              const flattened = {
                event: item.event,
                time: item.properties?.time,
                distinct_id: item.properties?.distinct_id,
                properties: JSON.stringify(item.properties || {}),
              };

              if (isFirstRow) {
                // Extract headers from first row - this will include all custom properties
                headers = Object.keys(flattened);
                const csvHeader = headers.join(",") + "\n";
                res.write(csvHeader);
                isFirstRow = false;
              }

              // Create CSV row
              const row = headers.map((header) => {
                const value = flattened[header];
                if (value === null || value === undefined) {
                  return "";
                }
                // Escape CSV values
                const stringValue = String(value);
                if (
                  stringValue.includes(",") ||
                  stringValue.includes('"') ||
                  stringValue.includes("\n")
                ) {
                  return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
              });

              res.write(row.join(",") + "\n");
            } catch (parseError) {
              console.warn("Skipping invalid JSON line:", parseError.message);
              continue;
            }
          }
        }
      });

      response.data.on("end", () => {
        // Process any remaining data in buffer
        if (buffer.trim()) {
          try {
            const item = JSON.parse(buffer);
            // Flatten all properties including custom ones using the utility function
            const baseProperties = {
              event: item.event,
              time: item.properties?.time,
              distinct_id: item.properties?.distinct_id,
            };

            // Include all properties as JSON string
            const flattened = {
              event: item.event,
              time: item.properties?.time,
              distinct_id: item.properties?.distinct_id,
              properties: JSON.stringify(item.properties || {}),
            };

            if (isFirstRow) {
              headers = Object.keys(flattened);
              const csvHeader = headers.join(",") + "\n";
              res.write(csvHeader);
            }

            const row = headers.map((header) => {
              const value = flattened[header];
              if (value === null || value === undefined) {
                return "";
              }
              const stringValue = String(value);
              if (
                stringValue.includes(",") ||
                stringValue.includes('"') ||
                stringValue.includes("\n")
              ) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            });

            res.write(row.join(",") + "\n");
          } catch (parseError) {
            console.warn(
              "Skipping invalid JSON line in final buffer:",
              parseError.message
            );
          }
        }
        res.end();
      });

      response.data.on("error", (error: Error) => {
        console.error("Stream error:", error);
        if (!res.headersSent) {
          res.status(500).json({ error: "Stream processing failed" });
        }
      });
    } catch (error) {
      console.error("Error streaming Mixpanel data:", error);
      if (res && !res.headersSent) {
        res.status(500).json({ error: "Failed to stream Mixpanel data" });
      }
      throw error;
    }
  }
  async setUserProfile(body: any) {
    try {
      console.log("body", body);
      let data = await this.http_service
        .post(
          `${this.configService.get("CASTTREE_BASE_URL")}/mixpanel/set-user-profile`,
          //  `http://localhost:3000/casttree/mixpanel/set-user-profile`,
          body
        )
        .toPromise();
      return JSON.stringify(data.data);
    } catch (err) {
      throw err;
    }
  }

  // Helper method to call external endpoint
  async generateNewMediaUrl(oldUrl: string): Promise<string> {
    try {
      const response = await axios.post(
        this.configService.get("CASTTREE_BASE_URL") + "/peertube",
        // "http://localhost:3000/casttree/peertube",
        {
          embeddedURL: oldUrl,
        },
        {
          headers: {
            "x-api-version": "2",
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error generating new media URL:", error);
      throw error;
    }
  }
  async getUserRatings(rawToken) {
    try {
      let data = await this.http_service
        .get(
          `${this.configService.get("CASTTREE_RATINGS_BASE_URL")}/ratings`,
          // `http://localhost:3200/casttree-ratings/ratings`,
          {
            headers: {
              Authorization: `${rawToken}`,
            },
          }
        )
        .toPromise();
      return data.data;
    } catch (error) {
      throw error;
    }
  }
  async getUserNominations(rawToken) {
    try {
      let data = await this.http_service
        .get(
          `${this.configService.get("CASTTREE_BASE_URL")}/nominations/user-nominations`,
          // `http://localhost:3000/casttree/nominations/user-nominations`,
          {
            headers: {
              Authorization: `${rawToken}`,
            },
          }
        )
        .toPromise();
      return data.data;
    } catch (error) {
      throw error;
    }
  }
}
