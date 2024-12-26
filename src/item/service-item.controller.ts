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
import { ServiceItemService } from "./service-item.service";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { FilterItemRequestDTO } from "./dto/filter-item.dto";


@Controller("service-item")
export class ServiceItemController {
  constructor(private serviceItemService: ServiceItemService) {}

  @Get()
  async getServiceItems(
    @Req() req,
    @Query(ValidationPipe) query: FilterItemRequestDTO,
    @Query("skip", ParseIntPipe) skip: number,
    @Query("limit", ParseIntPipe) limit: number
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
        limit
      );
      return data;
    } catch (err) {
      return err;
    }
  }

 
  @Get(":id")
  async getServiceItemDetails(
    @Req() req,
    @Param("id") _id: string
  ) {
    try {
      let data = await this.serviceItemService.getServiceItemDetails(
        _id,
        req.headers["x-country-code"]
    );
      return data;
    } catch (err) {
      return err;
    }
  }


  @Get("workShop/:id")
  async getworkShopServiceItemDetails(
    @Req() req,
    @Param("id") _id: string
  ) {
    try {
      let data = await this.serviceItemService.getworkShopServiceItemDetails(
        _id,
        
      );
      return data;
    } catch (err) {
      return err;
    }
  }
}
