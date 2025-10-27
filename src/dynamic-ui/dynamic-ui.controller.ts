import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  ValidationPipe,
  Req,
  Post,
  Body,
} from "@nestjs/common";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { DynamicUiService } from "./dynamic-ui.service";
import { EUpdateComponents } from "./dto/update-components.dto";
import { EUpdateSeriesTag } from "./dto/update-series-tag.dto";
import { ComponentFilterQueryDto, EFilterOption } from "./dto/filter-option.dto";
import { AddNewSeriesDto } from "./dto/add-new-series.dto";
import { AddNewEpisodesDto } from "./dto/add-new-episodes.dto";
import { taskModel } from "src/process/schema/task.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AddAchievementDto } from "./dto/add-achievement.dto";
import { CreateVirtualItemDto } from "./dto/create-virtual-item.dto";
import { MapVirtualItemToSeriesDto } from "./dto/map-virtual-item-to-series.dto";
import { UpdatePriorityOrderDto } from "./dto/update-priority-order.dto";


@Controller("dynamic-ui")
export class DynamicUiController {
  constructor(
    private dynamicUIService: DynamicUiService,
    @InjectModel("task")
    private readonly taskModel: Model<taskModel>,
  ) {}

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
    @GetToken() token: UserToken,
    @Query("skip") skip?: string,
    @Query("limit") limit?: string,
    @Query(new ValidationPipe({ transform: true })) filterOption?: EFilterOption
  ) {
    try {
      let data = await this.dynamicUIService.getPageDetails(
        token,
        pageId,
        skip ? parseInt(skip as any, 10) : undefined,
        limit ? parseInt(limit as any, 10) : undefined,
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
    @Query(new ValidationPipe({ transform: true })) filterOption: EFilterOption,
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
      const res = await this.dynamicUIService.updatePageComponents(pageId, updateDto);
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
  @Get("series-filter/:componentId")
  async getFilterComponent(
    @Req() req,
    @Param("componentId") componentId: string,
    @GetToken() token: UserToken,
    @Query(new ValidationPipe({ whitelist: true }))
    query: ComponentFilterQueryDto,
    @Query(new ValidationPipe({ transform: true })) filterOption: EFilterOption,
  ) {
    try {
      let data = await this.dynamicUIService.getFilterComponent(
        token,
        componentId,
        query,
        filterOption
      );
      return data;
  } catch (err) {
      throw err;
    }
  }
  
  @UseGuards(JwtAuthGuard)
  @Get("series/initial-data") 
  async getSeriesData(
    @Req() req,
  ) {
    try {
      const res = await this.dynamicUIService.getSeriesData();
      return res;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("series/create")
  async addNewSeries(
    @Req() req,
    @GetToken() token: UserToken,
    @Body(new ValidationPipe({ transform: true })) createDto: AddNewSeriesDto
  ) {
    try {
      const res = await this.dynamicUIService.addNewSeries(createDto);
      return res;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("episode/add")
  async addNewEpisodes(
    @Req() req,
    @GetToken() token: UserToken,
    @Body(new ValidationPipe({ transform: true })) createDto: AddNewEpisodesDto
  ) {
    try {
      const res = await this.dynamicUIService.addNewEpisodes(createDto);
      return res;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("currency")
  async getCurrencyList(
    @Req() req
  ) {
    try {
      const res = await this.dynamicUIService.getCurrencyList();
      return res;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("achievement/add")
  async addAchievement(  
    @Req() req,
    @Body(new ValidationPipe({ transform: true })) payload: AddAchievementDto
  ) {
    try {
      const res = await this.dynamicUIService.addNewAchievement(payload);
      return res;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("episode/media/update") 
  async updateEpisodeMedia(
    @Req() req,
    @Body(new ValidationPipe({ transform: true })) payload: { seriesId: string }
  ) {
    try {
      const res = await this.dynamicUIService.updateEpisodeMedia(payload);
      return res;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("virtual-item/:type")
  async getVirtualItemList(
    @Req() req,
    @Param("type") type: string
  ) {
    try {
      const res = await this.dynamicUIService.getVirtualItemList(type);
      return res;
    }
    catch (err) { 
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("virtual-item/create")
  async createVirtualItem(
    @Req() req,
    @Body(new ValidationPipe({ transform: true })) payload: CreateVirtualItemDto
  ) {
    try {
      const res = await this.dynamicUIService.createVirtualItem(payload);
      return res;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("virtual-item/series/map")
  async mapVirtualItemToSeries(
    @Req() req,
    @Body(new ValidationPipe({ transform: true })) payload: MapVirtualItemToSeriesDto
  ) {
    try {
      const res = await this.dynamicUIService.mapVirtualItemToSeries(payload);
      return res;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("gift/group")
  async getVirtualItemGroup(
    @Req() req
  ) {
    try {
      const res = await this.dynamicUIService.getVirtualItemGroup();
      return res;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("gift/group/create")
  async createVirtualItemGroup(
    @Req() req,
    @Body(new ValidationPipe({ transform: true })) payload: {groupName: string, giftIds: string[]}
  ) {
    try {
      const res = await this.dynamicUIService.createVirtualItemGroup(payload);
      return res;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("award")
  async getAwardList(
    @Req() req
  ) {
    try {
      const res = await this.dynamicUIService.getAwardList();
      return res;
    } catch (err) {
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("series/priority-order")
  async updatePriorityOrder(
    @Req() req,
    @Body(new ValidationPipe({ transform: true })) payload: UpdatePriorityOrderDto[]
  ) {
    try {
      const res = await this.dynamicUIService.updatePriorityOrder(payload);
      return res;
    } catch (err) {
      throw err;
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get("suggestions-tag")
  async getSuggestionsTag(
    @GetToken() token: UserToken,
    @Query("skillId") skillId: string,
    @Query("skillName") skillName: string
  ) {
    try {
      const res = await this.dynamicUIService.getSuggestionsTag(token, skillId, skillName);
      return res;
    } catch (err) {
      throw err;
    }
  }
}
