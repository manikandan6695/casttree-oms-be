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
import { paymentDTO } from "./dto/payment.dto";
import { PaymentRequestService } from "./payment-request.service";

@Controller("payment-request")
export class PaymentRequestController {
  constructor(
    private readonly paymentRequestService: PaymentRequestService,
    private sservice: SharedService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async initiatePayment(
    @GetToken() token: UserToken,
    @Body(new ValidationPipe({ whitelist: true })) body: paymentDTO,
    @Req() req,
    @Res() res: Response
  ) {
    try {
   //   console.log("inside initiate payment is ==>");

      let data = await this.paymentRequestService.initiatePayment(
        body,
        token,
        req["headers"]["authorization"]
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

  //@UseGuards(JwtAuthGuard)
  @Get(":id")
  async getPaymentDetail(@Param("id") id: string, @Res() res: Response) {
    try {
   //   console.log("test");
      let data: any = await this.paymentRequestService.getPaymentDetail(id);

      return res.json(data.payment);
    } catch (err) {
      const { code, response } = await this.sservice.processError(
        err,
        this.constructor.name
      );
      return res.status(code).json(response);
    }
  }

  @Get(":sourceId/user/:userId")
  async getPaymentDetailBySource(
    @Param("sourceId") sourceId: string,
    @Param("userId") userId: string,
    @Res() res: Response
  ) {
    try {
      let data: any = await this.paymentRequestService.getPaymentDetailBySource(

        userId,
        sourceId

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

  @Post("webhook/provider/:providerId")
  async paymentWebhook(
    @Req() req,
    @Param("providerId") providerId: string,
    @Res() res: Response
  ) {
    try {
      let data = await this.paymentRequestService.paymentWebhook(req);
      return res.json(data);
    } catch (err) {
      const { code, response } = await this.sservice.processError(
        err,
        this.constructor.name
      );
      return res.status(code).json(response);
    }
  }

  @Get("user/:userId")
  async getLatestSubscriptionPayments(
    @Param("userId") userId: string
  ) {
    try {
     let data = await this.paymentRequestService.getLatestSubscriptionPayments(userId);
     return data;
    } catch (err) {
      console.error("Error:", err);
      throw err;
    }
  }
  
  //   @Get("test/pavan")
  //   async testhmac()
  // {
  //   console.log("pavan");
  //   this.paymentRequestService.testhmac();
  // }
}
