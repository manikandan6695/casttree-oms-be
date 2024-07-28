import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
} from "@nestjs/common";
import { SharedService } from "../shared.service";
import { CityService } from "./city.service";
import { Response } from "express";

@Controller("city")
export class CityController {
  constructor(
    private city_service: CityService,
    private shared_service: SharedService
  ) {}
  @Get()
  async getCity(
    @Query("country") country: string,
    @Query("state") state: string,
    @Query("search") search: string,
    @Query("skip", ParseIntPipe) skip: number,
    @Query("limit", ParseIntPipe) limit: number,
    @Res() res: Response
  ) {
    try {
      let data = await this.city_service.getCity(
        country,
        state,
        search,
        skip,
        limit
      );
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
