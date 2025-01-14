import { Body, Controller, Post, UseGuards,Res, ValidationPipe, Req, Param } from "@nestjs/common";
import { SubscriptionService } from "./subscription.service";
import { SharedService } from "src/shared/shared.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { UserToken } from "src/user/dto/usertoken.dto";
import { Response } from "express";
import { CreateSubscriptionDTO } from "./dto/subscription.dto";

@Controller("subscription")
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private sservice: SharedService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createSubscription(
    @GetToken() token: UserToken,
    @Body(new ValidationPipe({ whitelist: true })) body: CreateSubscriptionDTO,
    @Res() res: Response
  ) {
    try {
      let data = await this.subscriptionService.createSubscription(body, token);
      return res.json(data);
    } catch (err) {
      const { code, response } = await this.sservice.processError(
        err,
        this.constructor.name
      );
      return res.status(code).json(response);
    }
  }
  @Post("webhook/provider/:providerId")
  async subscriptionWebhook(
    @Req() req,
    @Param("providerId") providerId: string,
    @Res() res: Response
  ) {
    try {
      let data = await this.subscriptionService.subscriptionWebhook(req);
      return res.json(data);
    } catch (err) {
      const { code, response } = await this.sservice.processError(
        err,
        this.constructor.name
      );
      return res.status(code).json(response);
    }
  }
}
