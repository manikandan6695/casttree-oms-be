import { HttpService } from "@nestjs/axios";
import { BadRequestException, Injectable, Req } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { SharedService } from "src/shared/shared.service";
import { getServiceRequestRatingsDto } from "./dto/getServicerequestRatings.dto";
import { catchError, lastValueFrom, map } from "rxjs";

@Injectable()
export class HelperService {
  constructor(
    private http_service: HttpService,
    private configService: ConfigService,
    private sharedService: SharedService
  ) {}

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
        .post(
          `${this.configService.get("CASTTREE_BASE_URL")}/helper/updateUserCountryCode`,
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
      return response.data["country_code2"];
    } catch (error) {
      return error;
    }
  }

  async addSubscription(body, token: UserToken) {
    try {
      let fv = {
        plan_id: body.plan_id,
        total_count: body.total_count,
        notes: {
          userId: body.notes.userId,
          sourceId: body.notes.sourceId,
          sourceType: body.notes.sourceType,
          itemId: body.notes.itemId,
        },
      };

      let razor_pay_key = this.configService.get("RAZORPAY_API_KEY");
      let razor_pay_secret = this.configService.get("RAZORPAY_SECRET_KEY");
      let data = await this.http_service
        .post(
          `${this.configService.get("RAZORPAY_BASE_URL")}/v1/subscriptions`,
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
          `${this.configService.get("CASHFREE_BASE_URL")}/user/${body.userId}`,
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
      const requestURL = `${this.configService.get("CASHFREE_BASE_URL")}/pg/subscriptions/pay`;
      const headers = {
        "x-api-version": "2025-01-01",
        "Content-Type": "application/json",
        "x-client-id": this.configService.get("CASHFREE_CLIENT_ID"),
        "x-client-secret": this.configService.get("CASHFREE_CLIENT_SECRET"),
      };
      const request = this.http_service
        .post(requestURL, body, { headers: headers })
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
      return response;
    } catch (err) {
      throw err;
    }
  }

  async getPlanDetails(planId: string) {
    try {
      const requestURL = `${this.configService.get("CASHFREE_BASE_URL")}/pg/plans/${planId}`;

      const headers = {
        "x-api-version": "2025-01-01",
        "Content-Type": "application/json",
        "x-client-id": this.configService.get("CASHFREE_CLIENT_ID"),
        "x-client-secret": this.configService.get("CASHFREE_CLIENT_SECRET"),
      };
      const request = this.http_service
        .get(requestURL, { headers: headers })
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
      return response;
    } catch (err) {
      throw err;
    }
  }

  async createSubscription(body, token) {
    try {
      const requestURL = `${this.configService.get("CASHFREE_BASE_URL")}/pg/subscriptions`;

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
}
