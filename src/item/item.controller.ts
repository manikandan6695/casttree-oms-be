import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { FilterPlatformItemDTO } from "./dto/filter-platformItem.dto";
import { ItemService } from "./item.service";

@Controller("item")
export class ItemController {
  constructor(private itemService: ItemService) {}
  @UseGuards(JwtAuthGuard)
  @Get("platformItem")
  async getPlatformItem(
    @GetToken() token: UserToken,
    @Query(ValidationPipe) query: FilterPlatformItemDTO,
    @Query("skip", ParseIntPipe) skip: number,
    @Query("limit", ParseIntPipe) limit: number
  ) {
    try {
   //   console.log(query);
      let data = await this.itemService.getPlatformItem(query, skip, limit);
      return data;
    } catch (err) {
      return err;
    }
  }

  @Get(":id")
  async getItemDetail(@Param("id") id: string) {
    try {
      let data = await this.itemService.getItemDetail(id);
      return data;
    } catch (err) {
      return err;
    }
  }
}
