import { Injectable, Req } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { EServiceRequestStatus } from "src/service-request/enum/service-request.enum";
import { IServiceRequestModel } from "src/service-request/schema/serviceRequest.schema";
import { ServiceResponseDTO } from "./dto/service-response.dto";
import { EServiceResponse } from "./enum/service-response.enum";
import { IServiceResponseModel } from "./schema/service-response.schema";

@Injectable()
export class ServiceResponseService {
  constructor(
    @InjectModel("serviceResponse")
    private readonly serviceResponseModel: Model<IServiceResponseModel>,
    @InjectModel("serviceRequest")
    private readonly serviceRequestModel: Model<IServiceRequestModel>
  ) {}

  async saveServiceResponse(body: ServiceResponseDTO, token: UserToken) {
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
