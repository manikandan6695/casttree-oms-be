import { Injectable } from "@nestjs/common";
import { MongooseModuleOptions } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { IDatabaseOptionsService } from "../interfaces/database.options-service.interface";
import { ENUM_APP_ENVIRONMENT } from "../../constants/common.enum";
import { NestVaultService } from "../../nest-vault/nest-vault.service";

@Injectable()
export class DatabaseOptionsService implements IDatabaseOptionsService {
  constructor(private readonly configService: NestVaultService) {}

  createOptions(): MongooseModuleOptions {
    const env = this.configService.get<string>("app.env");
    const host = this.configService.get<string>("database.host");
    const database = this.configService.get<string>("database.name");
    const user = this.configService.get<string>("database.user");
    const password = this.configService.get<string>("database.password");
    const debug = this.configService.get<boolean>("database.debug");

    const options = this.configService.get<string>("database.options")
      ? `?${this.configService.get<string>("database.options")}`
      : "";

    const timeoutOptions = this.configService.get<Record<string, number>>(
      "database.timeoutOptions",
    );

    let uri = `${host}`;

    if (database) {
      uri = `${uri}/${database}${options}`;
    }

    if (env !== ENUM_APP_ENVIRONMENT.PROD) {
      mongoose.set("debug", debug);
    }

    const mongooseOptions: MongooseModuleOptions = {
      uri,
      autoCreate: true,
      ...timeoutOptions,
    };

    if (user && password) {
      mongooseOptions.auth = {
        username: user,
        password: password,
      };
    }

    return mongooseOptions;
  }

  /**
   * kavimukil
   * Only to be used to test something
   * quickly. Like connection test
   */
  createOptionsTest(): MongooseModuleOptions {
    const uri = this.configService.get<string>("DB_URL");
    const mongooseOptions: MongooseModuleOptions = {
      uri,
      autoCreate: true,
    };

    return mongooseOptions;
  }
}
