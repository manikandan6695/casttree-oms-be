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
import {
  AddSubscriptionDTO,
  CreateSubscriptionDTO,
  ValidateSubscriptionDTO,
} from "./dto/subscription.dto";
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
    @Param("providerId") providerId: number,
    @Res() res: Response
  ) {
    try {
      let data = await this.subscriptionService.subscriptionWebhook(
        req,
        providerId
      );
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
    @Res() res: Response
  ) {
    try {
      let data = await this.subscriptionService.addSubscription(body, token);
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
  @Get("fetch-subscriptions")
  async fetchSubscriptions(@GetToken() token: UserToken, @Res() res: Response) {
    try {
      if (!token.id) {
        return res.json({ message: "User ID is required" });
      }

      const subscriptions =
        await this.subscriptionService.fetchSubscriptions(token);

      if (!subscriptions) {
        return res.json({ message: "No active subscriptions found" });
      }
      return res.json({
        data: {
          subscriptions: subscriptions.subscriptionData,
          mandates: subscriptions.mandatesData,
        },
      });
    } catch (err) {
      const { code, response } = await this.sservice.processError(
        err,
        this.constructor.name
      );
      return res.status(code).json(response);
    }
  }
  @UseGuards(JwtAuthGuard)
  @Post("cancel-subscriptions")
  async cancelSubscriptionStatus(
    @Body() body: any,
    @GetToken() token: UserToken,
    @Res() res: Response
  ) {
    try {
      const subData = await this.subscriptionService.cancelSubscriptionStatus(
        token,
        body
      );
      return res.json(subData);
    } catch (err) {
      const { code, response } = await this.sservice.processError(
        err,
        this.constructor.name
      );
      return res.status(code).json(response);
    }
  }

  @Post("validate-subscription/:userId")
  async validateSubscription(
    @Param("userId") userId: string,
    @Body(new ValidationPipe({ whitelist: true }))
    body: ValidateSubscriptionDTO,
    @Res() res: Response
  ) {
    try {
      let data = await this.subscriptionService.validateSubscription(
        userId,
        body.status
      );
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
