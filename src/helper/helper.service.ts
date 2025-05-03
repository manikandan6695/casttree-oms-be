import { HttpService } from "@nestjs/axios";
import { BadRequestException, Injectable, Req } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { catchError, lastValueFrom, map } from "rxjs";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { SharedService } from "src/shared/shared.service";
import { getServiceRequestRatingsDto } from "./dto/getServicerequestRatings.dto";

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
      return response.data["country_code2"];
    } catch (error) {
      return error;
    }
  }

  async addSubscription(body) {
    try {
      console.log("addSubscription body is", body);
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
      console.log("razorpay order creation fv", fv);

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
      console.log("response data is ==>", data.data);

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
      // console.log("token", token);

      let fv = {
        name: body.userName,
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

  async getUserAdditionalDetails(body) {
    try {
      // console.log("getUserAdditionalDetails body is", body);

      const requestURL = `${this.configService.get("CASTTREE_BASE_URL")}/user/get-user-additional/${body.userId}`;
      const request = this.http_service
        .get(requestURL, body)
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

  async updateUserAdditional(body) {
    try {
      // console.log("inisde update user additional", body);

      const requestURL = `${this.configService.get("CASTTREE_BASE_URL")}/user/update-user-additional/${body.userId}`;
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

  async facebookEvents(phoneNumber, currency, amount) {
    try {
      let hashedPhoneNumber = await this.sha256(phoneNumber);
      let data = await this.http_service
        .post(`${this.configService.get("FACEBOOK_EVENT_URL")}`, {
          data: [
            {
              event_name: "Purchase",
              event_time: Math.floor(Date.now() / 1000),
              action_source: "website",
              event_id: Math.floor(1000000000 + Math.random() * 9000000000),
              attribution_data: {
                attribution_share: "0.3",
              },
              original_event_data: {
                event_name: "Purchase",
                event_time: Math.floor(Date.now() / 1000),
              },
              user_data: {
                ph: hashedPhoneNumber,
              },
              custom_data: {
                currency: currency,
                value: amount,
              },
            },
          ],
          access_token: this.configService.get("FACEBOOK_ACCESS_TOKEN"),
        })
        .toPromise();
      return data.data;
    } catch (err) {
      throw err;
    }
  }

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
  async getNominations(id: string) {
    try {
      let data = await this.http_service
        .get(
          `${this.configService.get("CASTTREE_BASE_URL")}/nominations/award/${id}`
          // `http://localhost:3000/casttree/nominations/award/${id}`
        )
        .toPromise();
      // console.log("getNominations",data.data);
      return data.data;
    } catch (err) {
      throw err;
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
}
