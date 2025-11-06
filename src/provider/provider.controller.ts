import { Controller, Get, UseGuards, Res } from "@nestjs/common";
import { SharedService } from "src/shared/shared.service";
import { ProviderService } from "./provider.service";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { Response } from "express";

@Controller("provider")
export class ProviderController {
  constructor(
    private readonly providerService: ProviderService,
    private sservice: SharedService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getProvider(@GetToken() token: UserToken, @Res() res: Response) {
    try {
      const data = await this.providerService.getProvider(token);
      return res.json(data);
    } catch (err) {
      throw err;
    }
  }
}
