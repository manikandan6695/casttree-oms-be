import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class HelperService {
  constructor(
    private http_service: HttpService,
    private configService: ConfigService
  ) {}

  async getProfileById(userId: string[]) {
    try {
      let data = await this.http_service
        .post(`${this.configService.get("CASTTREE_BASE_URL")}/profile`, userId)
        .toPromise();

      return data.data;
    } catch (err) {
      throw err;
    }
  }
}
