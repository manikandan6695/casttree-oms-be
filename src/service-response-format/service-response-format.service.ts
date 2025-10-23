import { Injectable,forwardRef, Inject } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { HelperService } from "src/helper/helper.service";
import { SharedService } from "src/shared/shared.service";
import { IServiceResponseFormatModel } from "./schema/serviceResponseFormat.schema";

@Injectable()
export class ServiceResponseFormatService {
  constructor(
    @InjectModel("serviceResponseFormat")
    private readonly serviceResponseFormatModel: Model<IServiceResponseFormatModel>,
    private shared_service: SharedService,
    @Inject(forwardRef(() => HelperService))
    private helperService: HelperService
  ) {}

  async getServiceResponseFormat(platformItemId: string, token: UserToken) {
    try {
      let data = await this.serviceResponseFormatModel.find({
        platformItemId: platformItemId,
      });

      return data;
    } catch (err) {
      throw err;
    }
  }
}
