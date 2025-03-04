import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { Response } from "express";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { SharedService } from "src/shared/shared.service";
import { AddSubscriptionDTO, CreateSubscriptionDTO } from "./dto/subscription.dto";
import { SubscriptionService } from "./subscription.service";

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
  @UseGuards(JwtAuthGuard)
  @Get("comparision")
  async subscriptionComparision(
    @GetToken() token: UserToken,
    @Res() res: Response
  ) {
    try {
      let data = await this.subscriptionService.subscriptionComparision(token);
      return res.json(data);
    } catch (err) {
      const { code, response } = await this.sservice.processError(
        err,
        this.constructor.name
      );
      return res.status(code).json(response);
    }
  }

@UseGuards(JwtAuthGuard)
@Post("add-subscription")
async addSubscription(
  @Body(new ValidationPipe({ whitelist: true })) body: AddSubscriptionDTO,
  @GetToken() token: UserToken,
){
try{
  let data = await this.subscriptionService.addSubscription(body,token);
  return data;
}catch(err){}
}



@Get("validate-subscription/:userId")
async validateSubscription(
  @Param("userId") userId: string,
  @Res() res: Response
) {
  try {
    let data = await this.subscriptionService.validateSubscription(userId);
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
