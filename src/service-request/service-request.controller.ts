import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
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
import { FilterServiceRequestDTO } from "./dto/filter-service-request.dto";
import { ServiceRequestService } from "./service-request.service";

@Controller("service-request")
export class ServiceRequestController {
  constructor(
    private readonly serviceRequestService: ServiceRequestService,
    private sservice: SharedService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getServiceRequests(
    @Req() req,
    @Query(ValidationPipe) query: FilterServiceRequestDTO,
    @Query("skip", ParseIntPipe) skip: number,
    @Query("limit", ParseIntPipe) limit: number,
    @GetToken() token: UserToken,
    @Res() res: Response
  ) {
    try {
      let data = await this.serviceRequestService.getServiceRequests(
        query,
        token,
        req["headers"]["authorization"],
        req["headers"]["x-organization-id"],
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
    @Req() req: Request,
    @Param("id") id: string,
    @GetToken() token: UserToken,
    @Res() res: Response
  ) {
    try {
      let data = await this.serviceRequestService.getServiceRequest(
        id,
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

  @UseGuards(JwtAuthGuard)
  @Get(":id/response")
  async getServiceResponse(
    @Param("id") id: string,
    @GetToken() token: UserToken,
    @Res() res: Response
  ) {
    try {
      let data = await this.serviceRequestService.getServiceResponse(id, token);
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
  @Get("workshops/:itemId/participants/:userId")
  async getUserWorkshopStatus(
    @Param("itemId") itemId: string,
    @Param("userId") userId: string,
    @GetToken() token: UserToken
  ) {
    try {
      let data = await this.serviceRequestService.getUserWorkShopStatus(itemId,userId);
      return {data:data};
    } catch (err) {
      const { code, response } = await this.sservice.processError(
        err,
        this.constructor.name
      );
      throw err;
    }
  }
}
