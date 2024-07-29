import {
  Controller,
  Res,
  Post,
  Body,
  ValidationPipe,
  Get,
  UseGuards,
  Query,
  ParseIntPipe,
} from "@nestjs/common";
import { Response } from "express";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { ESourceType } from "src/service-request/enum/service-request.enum";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { SharedService } from "src/shared/shared.service";
import { CommentsService } from "./comments.service";
import { CommentsDTO } from "./dto/comments.dto";

@Controller("comments")
export class CommentsController {
  constructor(
    private commentsService: CommentsService,
    private sservice: SharedService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async addComment(
    @Res() res: Response,
    @Body(new ValidationPipe({ whitelist: true })) body: CommentsDTO,
    @GetToken() token: UserToken
  ) {
    try {
      let data = await this.commentsService.addComment(body, token);
      return res.json(data);
    } catch (err) {
      const { code, response } = await this.sservice.processError(
        err,
        this.constructor.name
      );
      return res.status(code).json(response);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getComments(
    @Query("sourceId") sourceId: string,
    @Query("sourceType") sourceType: ESourceType,
    @Query("skip", ParseIntPipe) skip: number,
    @Query("limit", ParseIntPipe) limit: number,
    @Res() res: Response
  ) {
    try {
      let data = await this.commentsService.getComments(
        sourceId,
        sourceType,
        skip,
        limit
      );
      return res.json(data);
    } catch (err) {
      const { code, response } = await this.sservice.processError(
        err,
        this.constructor.name
      );
      return res.status(code).json(response);
    }
  }
}
