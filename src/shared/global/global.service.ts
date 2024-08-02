import { Injectable } from "@nestjs/common";
import { SharedService } from "../shared.service";

@Injectable()
export class GlobalService {
  constructor(private shared_service: SharedService) {}

  async getShortURL(url: string) {
    try {
      let short_url = await this.shared_service.urlShortner(url);
      return { url: short_url };
    } catch (err) {
      throw err;
    }
  }
}
