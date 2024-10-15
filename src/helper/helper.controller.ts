import { Body, Controller, Post, Res, UseGuards, ValidationPipe } from "@nestjs/common";
import { SharedService } from "src/shared/shared.service";
import { HelperService } from "./helper.service";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { UserToken } from "src/auth/dto/usertoken.dto";

@Controller("helper")
export class HelperController {
  constructor(
    private sservice: SharedService,
    private helperService: HelperService
  ) {
 }
  @UseGuards(JwtAuthGuard)
  @Post("create-coupon-usage")
  async createCouponUsage(
    @Body(new ValidationPipe({ whitelist: true })) Body,
    @GetToken() token: UserToken
  ) {
    try {
      let data = await this.helperService.createCouponUsage(Body, token.toString());
      return data
    } catch (err) {
      const { code, response } = await this.sservice.processError(
        err,
        this.constructor.name
      );
      return err;
    }
  }
}
