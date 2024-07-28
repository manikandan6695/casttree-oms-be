import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { SharedService } from "src/shared/shared.service";
import { Response } from "express";
import { ServiceRequestService } from "./service-request.service";

@Controller("service-request")
export class ServiceRequestController {
  constructor(
    private readonly serviceRequestService: ServiceRequestService,
    private sservice: SharedService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getServiceRequests(
    @Query("requestStatus") requestStatus: string,
    @Query("skip", ParseIntPipe) skip: number,
    @Query("limit", ParseIntPipe) limit: number,
    @GetToken() token: UserToken,
    @Res() res: Response
  ) {
    try {
      let data = await this.serviceRequestService.getServiceRequests(
        requestStatus,
        token,
        skip,
        limit
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
  @Get(":id")
  async getServiceRequest(
    @Param("id") id: string,
    @GetToken() token: UserToken,
    @Res() res: Response
  ) {
    try {
      let data = await this.serviceRequestService.getServiceRequest(
        id,
        token
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
