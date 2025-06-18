import { UserToken } from "src/auth/dto/usertoken.dto";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import {
  Controller,
  Get,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  Param,
} from "@nestjs/common";
import { FeedService } from "./feed.service";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { NavBarResponseDto } from "./interface/dto/navbar-response.dto";
import { UserRequestDto } from "./interface/dto/user-request.dto";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { PageResponseDto } from "./interface/dto/page-response.dto";

@ApiTags("Feed")
@Controller("feed")
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getNavBarDetails(
    @Req() req: Request,
    @GetToken() token: UserToken
  ): Promise<NavBarResponseDto> {
    try {
      if (!token.id) {
        throw new HttpException(
          "User not authenticated",
          HttpStatus.UNAUTHORIZED
        );
      }

      return await this.feedService.getNavBarDetails(token.id);
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

  @Get(":pageId/page-details")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get page details with components" })
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved page details",
    type: PageResponseDto,
  })
  async getPageDetails(
    @Req() req: Request,
    @Param("pageId") pageId: string,
    @GetToken() token: UserToken
  ): Promise<PageResponseDto> {
    try {
      return await this.feedService.getPageDetails(pageId, token.id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Failed to fetch page details",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
