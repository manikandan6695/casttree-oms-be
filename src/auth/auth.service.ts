import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ISystemConfigurationModel } from "src/configuration/schema/system-configuration.schema";
import { SharedService } from "src/shared/shared.service";

var jwt = require("jsonwebtoken");
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private shared_service: SharedService,
    @InjectModel("system-configuration")
    private system_configuration_model: Model<ISystemConfigurationModel>
  ) {}

  async getSystemConfig() {
    try {
      let data = await this.system_configuration_model.find();
      return data;
    } catch (err) {
      throw err;
    }
  }
}
