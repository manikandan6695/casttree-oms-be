import { Body, Controller, Post, Res, UseGuards, ValidationPipe } from "@nestjs/common";
import { SharedService } from "src/shared/shared.service";
import { HelperService } from "./helper.service";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { UserToken } from "src/auth/dto/usertoken.dto";

@Controller("helper")
export class HelperController {
  constructor(
    private sservice: SharedService,
    private helperService: HelperService
  ) {
 }
 
  
}
