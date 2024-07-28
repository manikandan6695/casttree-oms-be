import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseInterceptors,
  ValidationPipe,
} from "@nestjs/common";
import { Response } from "express";
import { SharedService } from "../shared.service";
import { GetStateDTO } from "./dto/get-state-by-country.dto";
import { StateService } from "./state.service";
@Controller("state")
export class StateController {
  constructor(
    private state_service: StateService,
    private shared_service: SharedService
  ) {}
  
  @Get()
  async getCountryBasedStates(
    @Query("country") country: string,
    @Query("search") search: string,
    @Query("skip", ParseIntPipe) skip: number,
    @Query("limit", ParseIntPipe) limit: number,
    @Res() res: Response
  ) {
    try {
      let data = await this.state_service.getCountryBasedStates(
        country,
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

  @Post("get-states")
  async getStateList(
    @Body(new ValidationPipe()) body: GetStateDTO,
    @Res() res: Response
  ) {
    try {
      let data = await this.state_service.getStateList(body);
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
