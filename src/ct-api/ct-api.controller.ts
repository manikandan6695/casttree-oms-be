import {
  Body,
  Controller,
  Post,
  Res,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { SharedService } from "src/shared/shared.service";
import { CtApiService } from "./ct-api.service";
import { Response } from "express";
import { PeerTubeUserDTO } from "./dto/peer-tube.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { UserToken } from "src/user/dto/usertoken.dto";
import {
  PEERTUBE_LOGIN_API_THROTTLE_LIMIT,
  PEERTUBE_LOGIN_API_THROTTLE_TTL,
} from "src/shared/app.constants";
import { Throttle } from "@nestjs/throttler";

@Controller("peertube")
export class CtApiController {
  constructor(
    private sservice: SharedService,
    private ctService: CtApiService
  ) {}

 
}
