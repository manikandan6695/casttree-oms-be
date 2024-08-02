import { Controller, Get, ParseIntPipe, Query, Res } from "@nestjs/common";
import { CurrencyService } from "./currency.service";
import { Response } from "express";
import { SharedService } from "../shared.service";

@Controller("currency")
export class CurrencyController {
  constructor(
    private currency_service: CurrencyService,
    private shared_service: SharedService
  ) {}
  @Get("")
  async getCurrency(
    @Query("search") search: string,
    @Query("skip", ParseIntPipe) skip: number,
    @Query("limit", ParseIntPipe) limit: number,
    @Res() res: Response
  ) {
    try {
      let data = await this.currency_service.getCurrency(search, skip, limit);
      return res.json(data);
    } catch (err) {
      const { code, response } = this.shared_service.processError(
        err,
        this.constructor.name
      );
      return res.status(code).json(response);
    }
  }
}
