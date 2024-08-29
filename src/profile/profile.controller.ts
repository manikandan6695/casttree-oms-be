import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { SharedService } from "src/shared/shared.service";
import { ProfileService } from "./profile.service";
import { Response } from "express";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { GetToken } from "src/shared/decorator/getuser.decorator";
import { UserToken } from "src/user/dto/usertoken.dto";
import {
  AddProfileDTO,
  FilterProfileDTO,
  ProfileListDTO,
  UpdateProfileDTO,
  ValidateUserNameDTO,
} from "./dto/profile.dto";

@Controller("profile")
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private sservice: SharedService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async submitProfile(
    @GetToken() token: UserToken,
    @Body(new ValidationPipe({ whitelist: true })) body: AddProfileDTO,
    @Res() res: Response
  ) {
    try {
      let data = await this.profileService.submitProfile(body, token);
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
  @Get(":id")
  async getProfile(
    @Param("id") id: string,
    @GetToken() token: UserToken,
    @Res() res: Response
  ) {
    try {
      let data = await this.profileService.getProfile(id, token);
      return res.json(data);
    } catch (err) {
      const { code, response } = await this.sservice.processError(
        err,
        this.constructor.name
      );
      return res.status(code).json(response);
    }
  }
  @Get("get-profile-user/:userId")
  async getProfileByUserId(
    @Param("userId") userId: string,
    @Res() res: Response
  ) {
    try {
      let data = await this.profileService.getProfileByUserId(userId);
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
  @Patch(":id")
  async updateProfile(
    @Param("id") id: string,
    @GetToken() token: UserToken,
    @Body(new ValidationPipe({ whitelist: true })) body: UpdateProfileDTO,
    @Res() res: Response
  ) {
    try {
      let data = await this.profileService.updateProfile(id, body, token);
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
  @Post("suggestions")
  async getSuggestions(
    @GetToken() token: UserToken,
    @Body(new ValidationPipe({ whitelist: true })) body: FilterProfileDTO,
    @Res() res: Response
  ) {
    try {
      let data = await this.profileService.getSuggestions(body, token);
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
  @Post("get-profile-list")
  async getProfileList(
    @GetToken() token: UserToken,
    @Body(new ValidationPipe({ whitelist: true })) body: ProfileListDTO,
    @Res() res: Response
  ) {
    try {
      let data = await this.profileService.getProfileList(body, token);
      console.log("profile data is", data);

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
  @Post("validate-user")
  async validateUserName(
    @GetToken() token: UserToken,
    @Body(new ValidationPipe({ whitelist: true })) body: ValidateUserNameDTO,
    @Res() res: Response
  ) {
    try {
      let data = await this.profileService.validateUserName(body, token);
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
