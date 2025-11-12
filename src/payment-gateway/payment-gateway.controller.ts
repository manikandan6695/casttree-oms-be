import {
  Controller,
  Get,
  Query,
  Res,
  ValidationPipe,
} from "@nestjs/common";
import { Response } from "express";
import { PaymentGatewayService } from "./payment-gateway.service";
import {
  GetSupportedInstrumentsQueryDto,
  InstrumentsResponseDto,
} from "./dto/payment-gateway.dto";

@Controller("paymentGateway")
export class PaymentGatewayController {
  constructor(
    private readonly paymentGatewayService: PaymentGatewayService
  ) {}

  @Get("instruments")
  async getSupportedInstruments(
    @Query(new ValidationPipe({ whitelist: true, transform: true }))
    query: GetSupportedInstrumentsQueryDto,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data: InstrumentsResponseDto =
        await this.paymentGatewayService.getSupportedInstruments(
          query.paymentType,
          query.device
        );

      return res.json(data);
    } catch (err) {
      throw err;
    }
  }
}

