import { HttpService } from "@nestjs/axios";
import { Injectable, Req } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class HelperService {
  constructor(
    private http_service: HttpService,
    private configService: ConfigService
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

  async getProfileById(userId: string[], accessToken: string, type?: string) {
    try {
      let data = await this.http_service
        .post(
          `${this.configService.get("CASTTREE_BASE_URL")}/profile/get-profile-list`,
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

  async getRatings(sourceId: string[], sourceType: string,accessToken: string) {
    try {

      let data = await this.http_service
        .post(
      
          `${this.configService.get("CASTTREE_RATINGS_BASE_URL")}/ratings/get-aggregate-list`,
          { sourceIds: sourceId ,sourceType:sourceType},
          {
            headers: {
              Authorization: accessToken,
            },
          }
        )
        .toPromise();


      return data.data.ratingData;
    } catch (err) {
      throw err;
    }
  }

  async getRatingsSummary(sourceId: string, sourceType: string, accessToken: string) {
    try {

      let data = await this.http_service
        .get(
          `${this.configService.get("CASTTREE_RATINGS_BASE_URL")}/ratings/${sourceType}/${sourceId}/aggregate`,
       
         
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

  async createCouponUsage(body, accessToken: string ) {
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


  async getCouponUsage(id:string, accessToken: string ) {
    try {
      let data = await this.http_service
        .get(
        `${this.configService.get("CASTTREE_BASE_URL")}/coupon/get-coupon-usage/${id}`,
        //  `http://localhost:3000/casttree/coupon/get-coupon-usage/${id}`,  
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



}
