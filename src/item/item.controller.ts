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
import { FilterPlatformItemDTO } from "./dto/filter-platformItem.dto";
import { ItemService } from "./item.service";

@Controller("item")
export class ItemController {
  constructor(private itemService: ItemService) {}
  @Get("parent-items")
  async getParentItems(@Query("parentId") parentId: string) {
    try {
      let data = await this.itemService.getParentItemId(parentId);
      return data;
    } catch (error) {
      return error;
    }
  }
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

  @Get("get-item/:id")
  async getItem(
    @Req() req,
    @Param("id") id: string,
    @Query("skip") skip: number,
    @Query("limit") limit: number
  ) {
    try {
      let data = await this.itemService.getItem(
        id,
        skip,
        limit,
        req.headers["x-api-version"],
        req.headers["authorization"]
      );
      return data;
    } catch (err) {
      return err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("get-item/:id")
  @Version("2")
  async getItemV2(
    @Req() req,
    @Param("id") id: string,
    @Query("skip") skip: number,
    @Query("limit") limit: number
  ) {
    try {
      let data = await this.itemService.getItem(
        id,
        skip,
        limit,
        req.headers["x-api-version"],
        req.headers["authorization"]
      );
      return data;
    } catch (err) {
      return err;
    }
  }
}
