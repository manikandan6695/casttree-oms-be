import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { HelperService } from "src/helper/helper.service";
import { EServiceRequestStatus } from "src/service-request/enum/service-request.enum";
import { ServiceRequestService } from "src/service-request/service-request.service";
import { SharedService } from "src/shared/shared.service";
import { ServiceResponseDTO } from "./dto/service-response.dto";
import { EServiceResponse } from "./enum/service-response.enum";
import { IServiceResponseModel } from "./schema/service-response.schema";

@Injectable()
export class ServiceResponseService {
  constructor(
    @InjectModel("serviceResponse")
    private readonly serviceResponseModel: Model<IServiceResponseModel>,
    private shared_service: SharedService,
    private serviceRequestService: ServiceRequestService,
    private helperService: HelperService
  ) {}

  async saveServiceResponse(body: ServiceResponseDTO, token: UserToken) {
    try {
      let fv = {
        ...body,
        createdBy: token.id,
        updatedBy: token.id,
      };
      if (body.responseId) {
        await this.serviceResponseModel.updateOne(
          { _id: body.responseId },
          { $set: { ...fv } }
        );
      } else {
        await this.serviceResponseModel.create(fv);
      }
      if (body.feedbackStatus == EServiceResponse.submitted) {
        await this.serviceRequestService.updateServiceRequest(body.requestId, {
          requestStatus: EServiceRequestStatus.completed,
        });
      }
      return { message: "Saved Successfully" };
    } catch (err) {
      throw err;
    }
  }
}
