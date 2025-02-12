import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { FilterItemRequestDTO } from "./dto/filter-item.dto";
import { ServiceItemService } from "./service-item.service";

@Controller("service-item")
export class ServiceItemController {
  constructor(private serviceItemService: ServiceItemService) { }
 // @UseGuards(JwtAuthGuard)
  @Get("getSubscriptionPlanDetails")
  async getSubscriptionPlanDetails(@Req() req
  //,@GetToken() token: UserToken
  ) {
    try {
      let data = await this.serviceItemService.getSubscriptionPlanDetails(
        req.headers["x-country-code"] ?? "",req.headers["x-userid"]);
      return data;
    } catch (err) {
      throw err;
    }
  }

  //@UseGuards(JwtAuthGuard)
  @Get("getPromotionDetails/:processId")
  async getPromotionDetails(@Req() req, @Param("processId") processId: string
  //,@GetToken() token: UserToken,
) {
    try {
      let data = await this.serviceItemService.getPromotionDetails(processId,
        req.headers["x-country-code"] ?? "",req.headers["x-userid"]);
      return data;
    } catch (err) {
      throw err;
    }
  }

  //@UseGuards(JwtAuthGuard)
  @Get("getPremiumDetails")
  async getPremiumDetails(@Req() req, @Param("processId") processId: string
  //,@GetToken() token: UserToken,
) {
    try {
      let data = await this.serviceItemService.getPremiumDetails(
        req.headers["x-country-code"] ?? "",req.headers["x-userid"]);
      return data;
    } catch (err) {
      throw err;
    }
  }

 // @UseGuards(JwtAuthGuard)
  @Get()
  async getServiceItems(
    @Req() req,
    @Query(ValidationPipe) query: FilterItemRequestDTO,
    @Query("skip", ParseIntPipe) skip: number,
    @Query("limit", ParseIntPipe) limit: number,
    //@GetToken() token: UserToken
  ) {
    try {


      let data = await this.serviceItemService.getServiceItems(
        query,
        skip,
        limit,
        req.headers["x-country-code"],req.headers["x-userid"]
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
        limit
      );
      return data;
    } catch (err) {
      return err;
    }
  }

  @Get(":id")
  async getServiceItemDetails(@Req() req, @Param("id") _id: string) {
    try {
      let data = await this.serviceItemService.getServiceItemDetails(
        _id,
        req.headers["x-country-code"],
        req.headers["x-userid"],

      );
      return data;
    } catch (err) {
      return err;
    }
  }

  @Get("workShop/:id")
  async getworkShopServiceItemDetails(@Req() req, @Param("id") _id: string) {
    try {
      let data =
        await this.serviceItemService.getworkShopServiceItemDetails(_id);
      return data;
    } catch (err) {
      return err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("courses/home-screen-data")
  async getCourseHomeScreenData(@GetToken() token: UserToken) {
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
  async getPlanDetails(@Req() req, @Param("processId") processId: string,
  // @GetToken() token: UserToken
  ) {
    try {

      let data = await this.serviceItemService.getPlanDetails(processId,
        req.headers["x-country-code"] ?? "",req.headers["x-userid"]);
      return data;
    } catch (err) {
      throw err;
    }
  }



}
