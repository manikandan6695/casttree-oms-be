import {
  Controller,
  Get,
  UseGuards,
  Res,
  Post,
  Body,
  Query,
  ParseIntPipe,
  Patch,
  ValidationPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { SharedService } from "src/shared/shared.service";
import { UserService } from "./user.service";
import { Response } from "express";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { UserToken } from "./dto/usertoken.dto";
import { UpdateContactDTO, UpdateUserDTO } from "./dto/update-user.dto";
import { CreatePeerTubeUserDTO } from "./dto/create-peer-tube-user.dto";
import { Throttle } from "@nestjs/throttler";
import {
  PEERTUBE_LOGIN_API_THROTTLE_LIMIT,
  PEERTUBE_LOGIN_API_THROTTLE_TTL,
} from "src/shared/app.constants";
import { GetOrganization } from "src/auth/decorators/param/get-organization.decorator";

@Controller("user")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private sservice: SharedService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUser(@GetToken() token: UserToken, @Res() res: Response) {
    try {
      let roles = await this.userService.getUser(token);
      return res.json(roles);
    } catch (err) {
      const { code, response } = await this.sservice.processError(
        err,
        this.constructor.name
      );
      return res.status(code).json(response);
    }
  }

  @Post("get-user-detail")
  async getUserById(@Body() body: any, @Res() res: Response) {
    try {
      let data = await this.userService.getUserById(body.user_id);
      return res.json(data);
    } catch (err) {
      const { code, response } = await this.sservice.processError(
        err,
        this.constructor.name
      );
      return res.status(code).json(response);
    }
  }

  @Get("get-users")
  async getUsers(
    @Query("skip", ParseIntPipe) skip: number,
    @Query("limit", ParseIntPipe) limit: number,
    @Res() res: Response
  ) {
    try {
      let roles = await this.userService.getUsers(skip, limit);
      return res.json(roles);
    } catch (err) {
      const { code, response } = await this.sservice.processError(
        err,
        this.constructor.name
      );
      return res.status(code).json(response);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch("update-user")
  async updateUser(
    @GetToken() token: UserToken,
    @Body(new ValidationPipe({ whitelist: true })) body: UpdateUserDTO,
    @Res() res: Response
  ) {
    try {
      let data = await this.userService.updateUser(
        body,
        token,
        body.organizationId
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

  @UseGuards(JwtAuthGuard)
  @Patch()
  async updateUserDetails(
    @GetToken() token: UserToken,
    @Body(new ValidationPipe({ whitelist: true })) body: UpdateContactDTO,
    @Res() res: Response
  ) {
    try {
      let data = await this.userService.updateUserDetails(body, token);
      return res.json(data);
    } catch (err) {
      const { code, response } = await this.sservice.processError(
        err,
        this.constructor.name
      );
      return res.status(code).json(response);
    }
  }

  @Throttle({
    default: {
      ttl: PEERTUBE_LOGIN_API_THROTTLE_TTL,
      limit: PEERTUBE_LOGIN_API_THROTTLE_LIMIT,
    },
  })
  @UseGuards(JwtAuthGuard)
  @Post("peertube")
  async createPeerTubeUser(
    @Body(new ValidationPipe({ whitelist: true })) body: CreatePeerTubeUserDTO,
    @GetToken() token: UserToken,
    @Res() res: Response
  ) {
    try {
      let data = await this.userService.createPeerTubeUser(
        body,
        token,
        "APICall"
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
