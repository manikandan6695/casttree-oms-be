import { UserToken } from "./../auth/dto/usertoken.dto";
import { forwardRef, Injectable, Req, Inject } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { HelperService } from "src/helper/helper.service";
import { IServiceRequestModel } from "./schema/serviceRequest.schema";
import { ServiceResponseService } from "src/service-response/service-response.service";
import { FilterServiceRequestDTO } from "./dto/filter-service-request.dto";
import { EVisibilityStatus } from "./enum/service-request.enum";

const { ObjectId } = require("mongodb");
@Injectable()
export class ServiceRequestService {
  constructor(
    @InjectModel("serviceRequest")
    private readonly serviceRequestModel: Model<IServiceRequestModel>,
    @Inject(forwardRef(() => ServiceResponseService))
    private serviceResponseService: ServiceResponseService,
    private helperService: HelperService
  ) {}

  async getServiceRequests(
    query: FilterServiceRequestDTO,
    token: UserToken,
    accessToken: string,
    skip: number,
    limit: number
  ) {
    try {
      let filter = {
        requestStatus: query.requestStatus,
        requestedToUser: new ObjectId(token.id),
      };

      let data = await this.serviceRequestModel
        .find(filter)
        .populate({
          path: "itemId",
          populate: [
            {
              path: "platformItemId",
            },
          ],
        })
        .lean()
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit);

      let count = await this.serviceRequestModel.countDocuments();
      let response;
      for (let i = 0; i < data.length; i++) {
        let curr_data = data[i];
        response = await this.serviceResponseService.getServiceResponseDetail(
          curr_data._id
        );

        curr_data["response"] = response;
      }

      let requestedByIds = data.map((e) => e.requestedBy);

      if (requestedByIds.length) {
        let profileDetails = await this.helperService.getProfileById(
          requestedByIds,
          accessToken,
          null
        );
        let user = profileDetails["profileData"].reduce((a, c) => {
          a[c.userId] = c;
          return a;
        }, {});

        data.map((e) => {
          return (e["requestedBy"] = user[e.requestedBy]);
        });
      }

      return { data: data, count: count };
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
  async getServiceRequest(id: string, accessToken: string) {
    try {
      console.log("id is", id);

      let data = await this.serviceRequestModel
        .findOne({ _id: id })
        .populate({
          path: "itemId",
          populate: [
            {
              path: "platformItemId",
            },
          ],
        })
        .lean();
      let response = await this.serviceResponseService.getServiceResponseDetail(
        data._id
      );
      let profileDetails = await this.helperService.getProfileById(
        [data.requestedBy],
        accessToken,
        null
      );
      if (data.requestedBy) {
        let user = profileDetails["profileData"].reduce((a, c) => {
          a[c.userId] = c;
          return a;
        }, {});
        data["serviceResponse"] = response;
        data["requestedBy"] = user[data.requestedBy];
      }

      return { data: data };
    } catch (err) {
      throw err;
    }
  }
  async getServiceResponse(id: string, token?: UserToken) {
    try {
      let data = await this.serviceRequestModel
        .findOne({ _id: id })
        .populate({
          path: "itemId",
          populate: [
            {
              path: "platformItemId",
            },
          ],
        })
        .lean();
      let response = null;
      if (data.visibilityStatus == EVisibilityStatus.unlocked) {
        response = await this.serviceResponseService.getServiceResponseDetail(
          data._id
        );
      }

      // let profileDetails = await this.helperService.getProfileById(
      //   [data.requestedBy],
      //   req
      // );
      // if (data.requestedBy) {
      //   let user = profileDetails["profileData"].reduce((a, c) => {
      //     a[c.userId] = c;
      //     return a;
      //   }, {});
      //   data["serviceResponse"] = response;
      //   data["requestedBy"] = user[data.requestedBy];
      // }

      return { response };
    } catch (err) {
      throw err;
    }
  }

  async getServiceRequestDetail(id: string) {
    try {
      let data = await this.serviceRequestModel
        .findOne({ _id: id })
        .populate({
          path: "itemId",
          populate: [
            {
              path: "platformItemId",
            },
          ],
        })
        .lean();
      return { data: data };
    } catch (err) {
      throw err;
    }
  }
}
