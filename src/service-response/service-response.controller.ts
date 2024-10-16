import { ServiceResponseService } from "./service-response.service";
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { Response } from "express";
import { SharedService } from "src/shared/shared.service";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { ServiceResponseDTO } from "./dto/service-response.dto";

@Controller("service-response")
export class ServiceResponseController {
  constructor(
    private readonly serviceResponseService: ServiceResponseService,
    private sservice: SharedService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async saveServiceResponse(
    @Req() req: Request,
    @GetToken() token: UserToken,
    @Body(new ValidationPipe({ whitelist: true })) body: ServiceResponseDTO,
    @Res() res: Response
  ) {
    try {
      let data = await this.serviceResponseService.saveServiceResponse(
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
}
