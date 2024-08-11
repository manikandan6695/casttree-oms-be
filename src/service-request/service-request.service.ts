import { UserToken } from "./../auth/dto/usertoken.dto";
import { forwardRef, Injectable, Req, Inject } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { HelperService } from "src/helper/helper.service";
import { IServiceRequestModel } from "./schema/serviceRequest.schema";
import { ServiceResponseService } from "src/service-response/service-response.service";
import { FilterServiceRequestDTO } from "./dto/filter-service-request.dto";

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
    @Req() req,
    skip: number,
    limit: number
  ) {
    try {
      let filter = {};

      if (query.requestStatus) {
        filter["requestStatus"] = query.requestStatus;
      }
      if (query.requestedToUser) {
        filter["requestedToUser"] = new ObjectId(query.requestedToUser);
      }

      if (query.requestedToOrg) {
        filter["requestedToOrg"] = new ObjectId(query.requestedToOrg);
      }

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
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit);

      let count = await this.serviceRequestModel.countDocuments();

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
  async getServiceRequest(id: string, @Req() req) {
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
        req
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
}
