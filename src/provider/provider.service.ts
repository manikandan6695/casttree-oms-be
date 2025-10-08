import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { ISystemConfigurationModel } from "src/shared/schema/system-configuration.schema";
import { EProvider } from "./enum/provider.enum";

@Injectable()
export class ProviderService {
  constructor(
    @InjectModel("systemConfiguration")
    private systemConfigurationModel: Model<ISystemConfigurationModel>
  ) {}

  async getProvider(token: UserToken) {
    try {
      let provider = await this.systemConfigurationModel.findOne({
        key: EProvider.paymentGateway,
      }).lean();
      provider = provider?.value;
      
      return {data : provider};
    } catch (err) {
      throw err;
    }
  }
}
