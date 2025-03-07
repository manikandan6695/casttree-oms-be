import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
  ValidationPipe
} from "@nestjs/common";
import { Request, Response } from "express";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { SharedService } from "src/shared/shared.service";
import { ServiceResponseDTO } from "./dto/service-response.dto";
import { ServiceResponseService } from "./service-response.service";

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
