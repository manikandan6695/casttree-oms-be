import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  ValidationPipe,
  Headers,
  Req,
  Version,
} from "@nestjs/common";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { DynamicUiService } from "./dynamic-ui.service";

@Controller("dynamic-ui")
export class DynamicUiController {
  constructor(private dynamicUIService: DynamicUiService) {}

  @UseGuards(JwtAuthGuard)
  @Get("navbar/:key")
  async getNavBarDetails(
    @Req() req,
    @Param("key") key: string,
    @GetToken() token: UserToken
  ) {
    try {
      let data = await this.dynamicUIService.getNavBarDetails(token, key);
      return data;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("page/:pageId")
  async getPageDetails(
    @Req() req,
    @Param("pageId") pageId: string,
    @Query("category") category,
    @Query("proficiency") proficiency,
    @GetToken() token: UserToken
  ) {
    try {
      let data = await this.dynamicUIService.getPageDetails(token, pageId, category, proficiency);
      return data;
    } catch (err) {
      throw err;
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get("component/:componentId")
  async getComponent(
    @Req() req,
    @Param("componentId") componentId: string,
    @GetToken() token: UserToken,
    @Query("skip", ParseIntPipe) skip: number,
    @Query("limit", ParseIntPipe) limit: number
  ) {
    try {
      let data = await this.dynamicUIService.getComponent(
        token,
        componentId,
        skip,
        limit
      );
      return data;
    } catch (err) {
      throw err;
    }
  }
}
