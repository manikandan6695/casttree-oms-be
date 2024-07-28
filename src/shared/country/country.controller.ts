import { Controller, Get, ParseIntPipe, Query, Res } from "@nestjs/common";
import { SharedService } from "../shared.service";
import { CountryService } from "./country.service";
import { Response } from "express";
@Controller("country")
export class CountryController {
  constructor(
    private country_service: CountryService,
    private shared_service: SharedService
  ) {}
  @Get("")
  async getCountry(
    @Query("search") search: string,
    @Query("skip", ParseIntPipe) skip: number,
    @Query("limit", ParseIntPipe) limit: number,
    @Res() res: Response
  ) {
    try {
      let data = await this.country_service.getCountry(search, skip, limit);
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
