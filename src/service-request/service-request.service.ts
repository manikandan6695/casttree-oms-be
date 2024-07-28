import { UserToken } from "./../auth/dto/usertoken.dto";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { HelperService } from "src/helper/helper.service";
import { IServiceRequestModel } from "./schema/serviceRequest.schema";

@Injectable()
export class ServiceRequestService {
  constructor(
    @InjectModel("serviceRequest")
    private readonly serviceRequestModel: Model<IServiceRequestModel>,
    private helperService: HelperService
  ) {}

  async getServiceRequests(
    requestStatus: string,
    token: UserToken,
    skip: number,
    limit: number
  ) {
    try {
      let filter = { requestedToUser: token.id, requestStatus: requestStatus };
      let data = await this.serviceRequestModel
        .find(filter)
        .populate({
          path: "item",
          populate: [
            {
              path: "platformItemId",
            },
          ],
        })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit);
      let requestedByIds = data.map((e) => e.requestedBy);
      let user = await this.helperService.getProfileById(requestedByIds);

      return data;
    } catch (err) {
      throw err;
    }
  }
  async updateServiceRequest(id: string, body: any) {
    try {
      await this.serviceRequestModel.updateOne({ _id: id }, { $set: body });
      return { message: "Updated Successfully" };
    } catch (err) {
      throw err;
    }
  }
  async getServiceRequest(id: string, token: UserToken) {
    try {
    } catch (err) {
      throw err;
    }
  }
}
