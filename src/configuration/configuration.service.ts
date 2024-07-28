import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import { Model } from "mongoose";
import { app_variables } from "src/shared/shared.service";
import { IConfigurationModel } from "./schema/configuration.schema";
import { ISystemConfigurationModel } from "./schema/system-configuration.schema";
@Injectable()
export class ConfigurationService {
  constructor(
    @InjectModel("system-configuration")
    private system_configuration_model: Model<ISystemConfigurationModel>,
    @InjectModel("configuration")
    private configuration_model: Model<IConfigurationModel>
  ) {}

  async updateConfiguration(config_id: string, value: any) {
    try {
      await this.configuration_model.updateOne(
        { _id: config_id },
        { $set: value }
      );
    } catch (e) {
      throw e;
    }
  }

  async updateConfigurationByOrganization(organization_id: string, value: any) {
    try {
      await this.configuration_model.updateOne(
        { organization_id },
        { $set: value }
      );
    } catch (err) {
      throw err;
    }
  }

  async getOrganizationConfiguration(
    organization_id: string
  ): Promise<IConfigurationModel> {
    try {
      let configuration = await this.configuration_model.findOne({
        organization_id,
      });
      return configuration;
    } catch (err) {
      throw err;
    }
  }
}
