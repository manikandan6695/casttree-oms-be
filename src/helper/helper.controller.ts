import {
  Body,
  Controller,
  Post
} from "@nestjs/common";
import { HelperService } from "./helper.service";

@Controller("helper")
export class HelperController {
  constructor(
    private helperService: HelperService
  ) {}
  @Post("sendMail")
  async getPlatformItem(@Body() body) {
    try {
      let data = await this.helperService.sendMail(body);
      return data;
    } catch (err) {
      return err;
    }
  }

  @Post("sendWhatsappMessage")
  async sendWhastappMessage(@Body() body) {
    try {
      let data = await this.helperService.sendWhastappMessage(body);
      return data;
    } catch (err) {
      return err;
    }
  }
}
