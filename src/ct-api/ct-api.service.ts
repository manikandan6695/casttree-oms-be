import { Injectable, Req } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { SharedService } from "src/shared/shared.service";
import { PeerTubeUserDTO } from "./dto/peer-tube.dto";
import { UserToken } from "src/user/dto/usertoken.dto";
import { InjectModel } from "@nestjs/mongoose";
import { IUserModel } from "src/user/schema/user.schema";
import { Model } from "mongoose";
import { AppException } from "src/shared/app-exception";
const qs = require("qs");
@Injectable()
export class CtApiService {
  constructor(
    @InjectModel("user") private userModel: Model<IUserModel>,
    private http_service: HttpService,
    private configService: ConfigService
  ) {}

  async peerTubeTokenGeneration(
    body: PeerTubeUserDTO,
    password: string,
    token?: UserToken
  ) {
    try {
      let requestBody = {
        client_id: this.configService.get("PEERTUBE_CLIENT_ID"),
        client_secret: this.configService.get("PEERTUBE_CLIENT_SECRET"),
        grant_type: body.grantType || "password",
      };
      if (body?.grantType === "refresh_token") {
        requestBody["refresh_token"] = body.refreshToken;
      } else {
        let user;
        if (token) {
          user = await this.userModel.findOne({ _id: token.id });
        }
        requestBody["username"] =
          body.username || `user${body.phoneNumber.trim()}@casttree.com`;
        requestBody["password"] =
          password || token.id.concat(user.created_at.getTime().toString());
      }
      let fv = qs.stringify(requestBody);
      try {
        let data = await this.http_service
          .post(
            `${this.configService.get("PEERTUBE_BASE_URL")}/api/v1/users/token`,
            fv,
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          )
          .toPromise();
        return data.data;
      } catch (err) {
        throw new AppException(err.response.statusText, err.response.status);
      }
    } catch (err) {
      throw err;
    }
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

  async getServiceRequestByNomination(requestId: string, @Req() req) {
    try {
      const headers = {
        headers: {
          Authorization: `${req["headers"]["authorization"]}`,
        },
      };
      let data = await this.http_service
        .get(
          `${this.configService.get("CASTTREE_OMS_BASE_URL")}/service-request/${requestId}`,
          headers
        )
        .toPromise();

      return data.data.data;
    } catch (err) {
      throw err;
    }
  }

  async addSubscription(body, token: UserToken) {
    try {
      let fv = {
        plan_id: body.plan_id,
        total_count: 1,
        notes: {
          userId: body.notes.userId,
          sourceId: body.notes.sourceId,
          sourceType: body.notes.sourceType,
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

      console.log("data is", data);

      return data.data;
    } catch (err) {
      throw err;
    }
  }
}
