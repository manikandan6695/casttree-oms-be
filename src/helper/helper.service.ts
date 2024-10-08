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

  async getProfileById(userId: string[], @Req() req) {
    try {
      // console.log("req is", req);

      // console.log("user id is", userId, req["headers"]["authorization"]);
      // const headers = this.getRequiredHeaders(req);
      // ${this.configService.get("CASTTREE_BASE_URL")}
      let data = await this.http_service
        .post(
          `${this.configService.get("CASTTREE_BASE_URL")}/profile/get-profile-list`,
          { userIds: userId },
          {
            headers: {
              Authorization: `${req["headers"]["authorization"]}`,
            },
          }
        )
        .toPromise();
      // console.log("data is", data.data);

      return data.data;
    } catch (err) {
      throw err;
    }
  }

  async updateNominationStatus(body) {
    try {
      // console.log("body is", body);

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
      // console.log("data is", data.data);

      return data.data;
    } catch (err) {
      throw err;
    }
  }
}
