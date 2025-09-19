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
  Post,
  Body,
} from "@nestjs/common";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { DynamicUiService } from "./dynamic-ui.service";
import { EUpdateComponents } from "./dto/update-components.dto";
import { EUpdateSeriesTag } from "./dto/update-series-tag.dto";
import { EFilterOption } from "./dto/filter-option.dto";
import { UpdateNomineeTagDto } from "./dto/update-nominee-tag.dto";
import { UpdateNomineePositionDto } from "./dto/update-nominee-position.dto";

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
    @Query(new ValidationPipe({ transform: true })) filterOption: EFilterOption,
    @GetToken() token: UserToken
  ) {
    try {
      let data = await this.dynamicUIService.getPageDetails(
        token,
        pageId,
        filterOption
      );
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
    @Query("limit", ParseIntPipe) limit: number,
    @Query(new ValidationPipe({ transform: true })) filterOption: EFilterOption
  ) {
    try {
      let data = await this.dynamicUIService.getComponent(
        token,
        componentId,
        skip,
        limit,
        filterOption
      );
      return data;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("page/:pageId")
  async updatePageComponents(
    @Req() req,
    @Param("pageId") pageId: string,
    @Body() updateDto: EUpdateComponents
  ) {
    try {
      const res = await this.dynamicUIService.updatePageComponents(
        pageId,
        updateDto
      );
      return res;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("series/tag/update")
  async updateSeriesTag(
    @Req() req,
    @Body(new ValidationPipe({ transform: true })) updateDto: EUpdateSeriesTag
  ) {
    try {
      const res = await this.dynamicUIService.updateSeriesTag(updateDto);
      return res;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("contest/list")
  async getContestsList() {
    try {
      const res = await this.dynamicUIService.getContestsList();
      return res;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("contest/nominees/:awardId")
  async getNomineesList(@Param("awardId") awardId: string) {
    try {
      const res = await this.dynamicUIService.getNomineesList(awardId);
      return res;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("category/tags/:type")
  async getCategoryTags(@Param("type") type: string) {
    try {
      const res = await this.dynamicUIService.getCategoryTags(type);
      return res;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("nominee/tag/update")
  async updateNomineeTag(@Body() payload: UpdateNomineeTagDto) {
    try {
      const res = await this.dynamicUIService.updateNomineeTag(payload);
      return res;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("nominee/position/update")
  async updateNomineePosition(@Body() payload: UpdateNomineePositionDto) {
    try {
      const res = await this.dynamicUIService.updateNomineePosition(payload);
      return res;
    } catch (err) {
      throw err;
    }
  }
}
