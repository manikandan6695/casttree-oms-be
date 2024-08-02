import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { SharedService } from "src/shared/shared.service";
import { Response } from "express";
import { ServiceResponseFormatService } from "./service-response-format.service";

@Controller("service-response-format")
export class ServiceResponseFormatController {
  constructor(
    private readonly serviceResponseFormatService: ServiceResponseFormatService,
    private sservice: SharedService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getServiceResponseFormat(
    @Query("platformItemId") platformItemId: string,
    @GetToken() token: UserToken,
    @Res() res: Response
  ) {
    try {
      let data =
        await this.serviceResponseFormatService.getServiceResponseFormat(
          platformItemId,
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
