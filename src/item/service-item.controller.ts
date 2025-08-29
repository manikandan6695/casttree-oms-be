import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { FilterItemRequestDTO } from "./dto/filter-item.dto";
import { processIdListDTO } from "./dto/filter-platformItem.dto";
import { ServiceItemService } from "./service-item.service";

@Controller("service-item")
export class ServiceItemController {
  constructor(private serviceItemService: ServiceItemService) {}
  // @UseGuards(JwtAuthGuard)
  @Get("getSubscriptionPlanDetails")
  async getSubscriptionPlanDetails(
    @Req() req
    //,@GetToken() token: UserToken
  ) {
    try {
      let data = await this.serviceItemService.getSubscriptionPlanDetails(
        req.headers["x-country-code"] ?? "",
        req.headers["x-userid"]
      );
      return data;
    } catch (err) {
      throw err;
    }
  }
  @Get("promotion-details")
  async getPromotionDetailsV2() {
    try {
      let data = await this.serviceItemService.getPromotionDetailsV2();
      return data;
    } catch (err) {
      throw err;
    }
  }

  //@UseGuards(JwtAuthGuard)
  @Get("getPromotionDetails/:processId")
  async getPromotionDetails(
    @Req() req,
    @Param("processId") processId: string
    //,@GetToken() token: UserToken,
  ) {
    try {
      let data = await this.serviceItemService.getPromotionDetails(
        processId,
        req.headers["x-country-code"] ?? "",
        req.headers["x-userid"]
      );
      return data;
    } catch (err) {
      throw err;
    }
  }

  //@UseGuards(JwtAuthGuard)
  @Get("getPremiumDetails")
  async getPremiumDetails(
    @Req() req,
    @Param("processId") processId: string
    //,@GetToken() token: UserToken,
  ) {
    try {
      let data = await this.serviceItemService.getPremiumDetails(
        req.headers["x-country-code"] ?? "",
        req.headers["x-userid"]
      );
      return data;
    } catch (err) {
      throw err;
    }
  }
  @Get("skills")
  async getContestDetailBySkillId( @Req() req) {
    try {
      const data = await this.serviceItemService.getContestDetailBySkillId(req.headers["x-userid"]);
      return data;
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("trending-series")
  async getTrendingSeries(
    @Req() req,
    @Query("skip", ParseIntPipe) skip: number,
    @Query("limit", ParseIntPipe) limit: number,
    @GetToken() token: UserToken
  ) {
    try {
      let data = await this.serviceItemService.getTrendingSeries(
        skip,
        limit,
        token.id,
        req.headers["x-country-code"]
        
      );
      return data;
    } catch (err) {
      return err;
    }
  }

  // @UseGuards(JwtAuthGuard)
  @Get()
  async getServiceItems(
    @Req() req,
    @Query(ValidationPipe) query: FilterItemRequestDTO,
    @Query("skip", ParseIntPipe) skip: number,
    @Query("limit", ParseIntPipe) limit: number
    //@GetToken() token: UserToken
  ) {
    try {
      let data = await this.serviceItemService.getServiceItems(
        query,
        skip,
        limit,
        req.headers["x-country-code"]
      );
      return data;
    } catch (err) {
      return err;
    }
  }

  @Get("workShop")
  async getWorkshopServiceItems(
    @Req() req,
    @Query(ValidationPipe) query: FilterItemRequestDTO,
    @Query("skip", ParseIntPipe) skip: number,
    @Query("limit", ParseIntPipe) limit: number
  ) {
    try {
      let data = await this.serviceItemService.getWorkshopServiceItems(
        query,

        skip,
        limit,
        req.headers["x-userid"],
        req.headers["x-country-code"]
      );
      return data;
    } catch (err) {
      return err;
    }
  }
  @Get("service-items")
  async getServiceItem() {
    try {
      let data = await this.serviceItemService.getServiceItem();
      return data;
    } catch (err) {
      throw err;
    }
  }
  @Get(":id")
  async getServiceItemDetails(@Req() req, @Param("id") _id: string) {
    try {
      let data = await this.serviceItemService.getServiceItemDetails(
        _id,
        req.headers["x-country-code"],
        req.headers["x-userid"]
      );
      return data;
    } catch (err) {
      return err;
    }
  }

  @Get("workShop/:id")
  async getworkShopServiceItemDetails(@Req() req, @Param("id") _id: string) {
    try {
      let data = await this.serviceItemService.getworkShopServiceItemDetails(
        _id,
        req.headers["x-userid"],
        req.headers["x-country-code"]
      );
      return data;
    } catch (err) {
      return err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("courses/home-screen-data")
  async getCourseHomeScreenData(@GetToken() token: UserToken, @Req() req) {
    try {
      let data = await this.serviceItemService.getCourseHomeScreenData(
        token.id
      );
      return data;
    } catch (err) {
      throw err;
    }
  }

  // @UseGuards(JwtAuthGuard)
  @Get("getPlanDetails/:processId")
  async getPlanDetails(
    @Req() req,
    @Param("processId") processId: string
    // @GetToken() token: UserToken
  ) {
    try {
      let data = await this.serviceItemService.getPlanDetails(
        processId,
        req.headers["x-country-code"] ?? "",
        req.headers["x-userid"]
      );
      return data;
    } catch (err) {
      throw err;
    }
  }

  @Post("service-item-details/process")
  async getServiceItemDetailsByProcessId(
    @Body(new ValidationPipe({ whitelist: true })) body: processIdListDTO
  ) {
    try {
      let data = await this.serviceItemService.getServiceItemDetailbyProcessId(
        body.processId,
        body.userId
      );
      return data;
    } catch (err) {
      throw err;
    }
  }

  @Get("item/:itemId")
  async getServiceItemType(@Param("itemId") itemId: string) {
    try {
      let data = await this.serviceItemService.getServiceItemType(itemId);
      return data;
    } catch (err) {
      throw err;
    }
  }
  @Get("processDetail/:processId")
  async getProcessDetailByProcessId(@Param("processId") processId: string) {
    try {
      let data =
        await this.serviceItemService.getServuceItemDetailsByProcessId(
          processId
        );
      return data;
    } catch (error) {
      throw error;
    }
  }
}
