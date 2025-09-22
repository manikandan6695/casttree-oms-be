import { Body, Controller, Get, Post, Param, Query} from "@nestjs/common";
import { SharedService } from "src/shared/shared.service";
import { HelperService } from "./helper.service";
import { BannerResponseDto } from "./dto/getBanner.dto";

@Controller("helper")
export class HelperController {
  constructor(
    private sservice: SharedService,
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
  @Get("banner/:userId")
  async getBannerToShow(
    @Param("userId") userId: string,
    @Query("componentKey") componentKey: string
  ): Promise<BannerResponseDto> {
    try {
      const data = await this.helperService.getBannerToShow(
        userId,
        componentKey
      );
      return data;
    } catch (err) {
      throw err;
    }
  }
}
