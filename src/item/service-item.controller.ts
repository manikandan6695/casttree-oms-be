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
  @UseGuards(JwtAuthGuard)
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
        req["headers"]["authorization"],
        skip,
        limit
      );
      return data;
    } catch (err) {
      return err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  async getServiceItemDetails(
    @Req() req,
    @Param("id") _id: string
  ) {
    try {
      let data = await this.serviceItemService.getServiceItemDetails(
        _id,
        req["headers"]["authorization"],
      );
      return data;
    } catch (err) {
      return err;
    }
  }
}
