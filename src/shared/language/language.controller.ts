import { Controller, Get, ParseIntPipe, Query, Res } from "@nestjs/common";
import { SharedService } from "../shared.service";
import { LanguageService } from "./language.service";
import { Response } from "express";

@Controller("language")
export class LanguageController {
  constructor(
    private language_service: LanguageService,
    private shared_service: SharedService
  ) {}
  @Get("")
  async getLanguage(
    @Query("search") search: string,
    @Query("skip", ParseIntPipe) skip: number,
    @Query("limit", ParseIntPipe) limit: number,
    @Res() res: Response
  ) {
    try {
      let data = await this.language_service.getLanguage(search, skip, limit);
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
