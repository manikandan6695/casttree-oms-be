import {
  Body,
  Controller,
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
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async initiatePayment(
    @GetToken() token: UserToken,
    @Body(new ValidationPipe({ whitelist: true })) body: paymentDTO,
    @Req() req,
    @Res() res: Response
  ) {
    try {
      let data = await this.paymentRequestService.initiatePayment(
        body,
        token,
        req
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
