import { UserToken } from "./../auth/dto/usertoken.dto";
import { Injectable, Req } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { HelperService } from "src/helper/helper.service";
import { IServiceRequestModel } from "./schema/serviceRequest.schema";
import { ServiceResponseService } from "src/service-response/service-response.service";
const { ObjectId } = require("mongodb");
@Injectable()
export class ServiceRequestService {
  constructor(
    @InjectModel("serviceRequest")
    private readonly serviceRequestModel: Model<IServiceRequestModel>,
    private serviceResponseService: ServiceResponseService,
    private helperService: HelperService
  ) {}

  async getServiceRequests(
    requestStatus: string,
    token: UserToken,
    skip: number,
    limit: number,
    @Req() req
  ) {
    try {
      let filter = {
        requestStatus: requestStatus,
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
          req
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
  async getServiceRequest(id: string, token: UserToken, @Req() req) {
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
      let response = await this.serviceResponseService.getServiceResponseDetail(
        data._id
      );
      let profileDetails = await this.helperService.getProfileById(
        [data.requestedBy],
        req
      );
      if (data.requestedBy) {
        let user = profileDetails["profileData"].reduce((a, c) => {
          a[c.userId] = c;
          return a;
        }, {});
        // console.log("user is", user);
        data["serviceResponse"] = response;
        // data.map((e1) => {
        //   return (e1["requestedBy"] = user[e1._id]);
        // });
        data["requestedBy"] = user[data.requestedBy];
      }

      return { data: data };
    } catch (err) {
      throw err;
    }
  }
}
