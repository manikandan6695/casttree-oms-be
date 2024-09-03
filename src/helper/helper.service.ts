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

  async getProfileById(userId: string[], @Req() req,type?: string,) {
    try {

     // req["headers"]["authorization"] = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2NDQ0ZWI4MDc2Mjk4ZGFkYmNlMWU0MyIsInVzZXJOYW1lIjoiQXN3aW4gRGhhbmFuamFpIiwicGhvbmVOdW1iZXIiOiI4MDE1NTg0NjI0IiwiY2l0eSI6IjYwOTE1MjU2ZmE3NDczNWM2YzRmZTlhMyIsInN0YXRlIjoiNjA5MTUyNTJmOGQ5ZWExZDgyNzczMzIyIiwicHJvZmlsZUlkIjoiNjY2NzI3NDIzYmMwZjEyNzVkNzk2OGM1IiwiaWF0IjoxNzI1Mjc2OTk1LCJleHAiOjE3MjUzNjMzOTV9.kr3vifRzJ43oUyK7EFaf3LFTD1cShxYzELf9m7NIadA";
   
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
        console.log("data is", data.data.profileData);

      return data.data.profileData;
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
}
