import { GetNavBarDetailsQuery } from "./application/query/impl/get-navbar-details.query";
import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";
import { GetToken } from "../shared/decorator/getuser.decorator";
import { UserToken } from "../auth/dto/usertoken.dto";
// import { NavBarResponseDto } from "./dto/navbar-response.dto"; // Uncomment and adjust as needed
// import { FindPageByIdRequestParam, FindPageByIdResponseDTO, ResponseDefaultSerialization } from "./dto/page-response.dto"; // Uncomment and adjust as needed
// import { ResponseSerializationDecorator } from "../shared/decorator/response-serialization.decorator"; // Uncomment and adjust as needed
// import { ResponseDescription } from "../shared/app.constants"; // Uncomment and adjust as needed
import { GetPageConfigQuery } from "./application/query/impl/get-page-config.query";

@Controller("dynamic-ui")
export class DynamicUIController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get("navbar-details")
  @UseGuards(JwtAuthGuard)
  async getNavBarDetails(@Req() req, @GetToken() token: UserToken) {
    try {
      if (!token.id) {
        throw new HttpException(
          "User not authenticated",
          HttpStatus.UNAUTHORIZED
        );
      }

      return await this.queryBus.execute(new GetNavBarDetailsQuery(token.id));
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Failed to fetch navigation bar details",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(":pageId/get-page-detail")
  async findUserByIdAsync(
    @Param("pageId") pageId: string,
    @GetToken() token: UserToken
  ) {
    // Pass userId to the CQRS query for page details
    return this.queryBus.execute(new GetPageConfigQuery(pageId, token.id));
  }
}
