import { Controller, Get, Res, UseGuards, Query } from "@nestjs/common";
import { Response } from "express";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { SharedService } from "../shared.service";
import { GlobalService } from "./global.service";

@Controller("global")
export class GlobalController {
  constructor(
    private global_service: GlobalService,
    private readonly shared_service: SharedService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("get-short-url")
  async getShortURL(@Query("url") url: string, @Res() res: Response) {
    try {
      let data = await this.global_service.getShortURL(url);
      return res.json(data);
    } catch (err) {
      const { code, response } = this.shared_service.processError(
        err,
        this.constructor.name
      );
      return res.status(code).json(response);
    }
  }

  @Get("default-values")
  async getGlobalValues() {
    return this.shared_service.getDefaultValues();
  }
}
