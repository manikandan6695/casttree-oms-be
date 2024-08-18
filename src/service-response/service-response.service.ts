import { forwardRef, Inject, Injectable, Req } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { EServiceRequestStatus } from "src/service-request/enum/service-request.enum";
import { IServiceRequestModel } from "src/service-request/schema/serviceRequest.schema";
import { ServiceRequestService } from "src/service-request/service-request.service";
import { UPDATE_NOMINATION_STATUS } from "src/shared/app.constants";
import { SharedService } from "src/shared/shared.service";
import { ServiceResponseDTO } from "./dto/service-response.dto";
import { EServiceResponse } from "./enum/service-response.enum";
import { IServiceResponseModel } from "./schema/service-response.schema";

@Injectable()
export class ServiceResponseService {
  constructor(
    @InjectModel("serviceResponse")
    private readonly serviceResponseModel: Model<IServiceResponseModel>,
    @InjectModel("serviceRequest")
    private readonly serviceRequestModel: Model<IServiceRequestModel>,
    @Inject(forwardRef(() => ServiceRequestService))
    private serviceRequestService: ServiceRequestService,
    private shared_service: SharedService
  ) {}

  async saveServiceResponse(
    body: ServiceResponseDTO,
    token: UserToken,
    @Req() req
  ) {
    try {
      let fv = {
        ...body,
        createdBy: token.id,
        updatedBy: token.id,
      };
      let response;
      if (body.responseId) {
        await this.serviceResponseModel.updateOne(
          { _id: body.responseId },
          { $set: { ...fv } }
        );
      } else {
        response = await this.serviceResponseModel.create(fv);
      }
      if (body.feedbackStatus == EServiceResponse.submitted) {
        await this.serviceRequestModel.updateOne(
          { _id: body.requestId },
          { $set: { requestStatus: EServiceRequestStatus.completed } }
        );
        let serviceRequestDetails =
          await this.serviceRequestService.getServiceRequest(
            body.requestId,
            req
          );
        // await this.shared_service.trackAndEmitEvent(
        //   UPDATE_NOMINATION_STATUS,
        //   serviceRequestDetails,
        //   true,
        //   {
        //     userId: token.id,
        //     resourceUri: null,
        //     action: null,
        //   }
        // );
        return { message: "Updated Successfully" };
      }
      let responseId = body.responseId ? body.responseId : response._id;
      return { message: "Saved Successfully", responseId };
    } catch (err) {
      throw err;
    }
  }

  async getServiceResponseDetail(id: any) {
    try {
      let data = await this.serviceResponseModel.findOne({ requestId: id });
      return data;
    } catch (err) {
      throw err;
    }
  }
}
