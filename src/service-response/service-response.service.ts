import { forwardRef, Inject, Injectable, Req } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserToken } from "src/auth/dto/usertoken.dto";
import { HelperService } from "src/helper/helper.service";
import { EServiceRequestStatus } from "src/service-request/enum/service-request.enum";
import { IServiceRequestModel } from "src/service-request/schema/serviceRequest.schema";
import { ServiceRequestService } from "src/service-request/service-request.service";
import { UPDATE_NOMINATION_STATUS } from "src/shared/app.constants";
import { ECommandProcessingStatus } from "src/shared/enum/command-source.enum";
import { SharedService } from "src/shared/shared.service";
import { ServiceResponseDTO } from "./dto/service-response.dto";
import { EServiceResponse } from "./enum/service-response.enum";
import { IUpdateNominationStatusByRequestEvent } from "./interfaces/update-service-response.interface";
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
    private shared_service: SharedService,
    private helperService: HelperService,
    private readonly eventEmitter: EventEmitter2
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
        if (serviceRequestDetails.data) {
          const nominationStatusUpdateEventPayload: IUpdateNominationStatusByRequestEvent =
            {
              requestId: serviceRequestDetails.data._id,
              isPassed: body.additionalDetail.isPassed,
              token: req["headers"]["authorization"],
            };
          await this.eventEmitter.emitAsync(
            UPDATE_NOMINATION_STATUS,
            nominationStatusUpdateEventPayload
          );
        }
        return { message: "Updated Successfully" };
      }
      let responseId = body.responseId ? body.responseId : response._id;
      return { message: "Saved Successfully", responseId };
    } catch (err) {
      throw err;
    }
  }

  @OnEvent(UPDATE_NOMINATION_STATUS)
  async updateNominationStatusByRequest(
    payload: IUpdateNominationStatusByRequestEvent
  ) {
    try {
      await this.shared_service.updateEventProcessingStatus(
        payload?.commandSource,
        ECommandProcessingStatus.InProgress
      );
      console.log("payload is", payload);
      await this.helperService.updateNominationStatus(payload);

      await this.shared_service.updateEventProcessingStatus(
        payload?.commandSource,
        ECommandProcessingStatus.Complete
      );
    } catch (err) {
      await this.shared_service.updateEventProcessingStatus(
        payload?.commandSource,
        ECommandProcessingStatus.Failed
      );
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
