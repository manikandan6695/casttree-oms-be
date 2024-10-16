import { UserToken } from "./../auth/dto/usertoken.dto";
import { forwardRef, Injectable, Req, Inject } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { HelperService } from "src/helper/helper.service";
import { IServiceRequestModel } from "./schema/serviceRequest.schema";
import { ServiceResponseService } from "src/service-response/service-response.service";
import { FilterServiceRequestDTO } from "./dto/filter-service-request.dto";
import {
  EServiceRequestMode,
  EServiceRequestStatus,
  EVisibilityStatus,
} from "./enum/service-request.enum";
import { AddServiceRequestDTO } from "./dto/add-service-request.dto";
import { ServiceItemService } from "src/item/service-item.service";

const { ObjectId } = require("mongodb");
@Injectable()
export class ServiceRequestService {
  constructor(
    @InjectModel("serviceRequest")
    private readonly serviceRequestModel: Model<IServiceRequestModel>,
    @Inject(forwardRef(() => ServiceResponseService))
    private serviceResponseService: ServiceResponseService,
    private helperService: HelperService,
    @Inject(forwardRef(() => ServiceItemService))
    private serviceItemService: ServiceItemService
  ) { }

  async getServiceRequests(
    query: FilterServiceRequestDTO,
    token: UserToken,
    accessToken: string,
    organizationId: string,
    skip: number,
    limit: number
  ) {
    try {

      const filter = {
        requestStatus: query.requestStatus,
        ...(query.mode === EServiceRequestMode.assign
          ? {
            requestedToUser: new ObjectId(token.id),
            requestedToOrg: new ObjectId(organizationId),
          }
          : {
            requestedBy: new ObjectId(token.id),
            requestedByOrg: new ObjectId(organizationId),
          }),
      };

      console.log("Filter is", filter);

      let sorting = {};
      if (query.mode === EServiceRequestMode.assign) {
        sorting = query.requestStatus === EServiceRequestStatus.pending ? { _id: 1 } : { _id: -1 };
      }
      if (query.mode === EServiceRequestMode.created) {
        sorting = query.requestStatus === EServiceRequestStatus.pending ? { _id: -1 } : { _id: -1 };
      }

      const data = await this.serviceRequestModel
        .find(filter)
        .populate({
          path: "itemId",
          populate: [{ path: "platformItemId" }],
        })
        .lean()
        .sort(sorting)
        .skip(skip)
        .limit(limit);

      const count = await this.serviceRequestModel.countDocuments(filter);

      await Promise.all(
        data.map(async (curr_data) => {
          const response =
            await this.serviceResponseService.getServiceResponseDetail(
              curr_data._id
            );
          curr_data["response"] = response;
        })
      );

      await this.attachUserProfiles(data, accessToken);

      return { data, count };
    } catch (err) {
      throw err;
    }
  }

  private async attachUserProfiles(data: any[], accessToken: string) {
    const requestedByIds = data.map((e) => e.requestedBy).filter(Boolean);
    const requestedToUserIds = data
      .map((e) => e.requestedToUser)
      .filter(Boolean);

    if (requestedByIds.length) {
      const requestedByProfiles = await this.fetchProfiles(
        requestedByIds,
        accessToken,
        null
      );
      const requestedByMap = this.mapProfilesById(requestedByProfiles);
      data.forEach((e) => (e["requestedBy"] = requestedByMap[e.requestedBy]));
    }

    // Fetch profiles for requestedToUser
    if (requestedToUserIds.length) {
      const requestedToUserProfiles = await this.fetchProfiles(
        requestedToUserIds,
        accessToken,
        "Expert"
      );
      const requestedToUserMap = this.mapProfilesById(requestedToUserProfiles);
      data.forEach(
        (e) => (e["requestedToUser"] = requestedToUserMap[e.requestedToUser])
      );
    }
  }

  private async fetchProfiles(
    ids: string[],
    accessToken: string,
    role: string | null
  ) {
    return await this.helperService.getProfileById(ids, accessToken, role);
  }

  private mapProfilesById(profiles: any[]) {
    return profiles.reduce((acc, profile) => {
      acc[profile.userId] = profile;
      return acc;
    }, {});
  }

  async createServiceRequest(body: AddServiceRequestDTO, token: UserToken) {
    try {
      const {
        itemId,
        requestedToUser,
        requestedToOrg,
        requestedByOrg,
        projectId,
        customQuestions,
        sourceId,
        sourceType,
        requestId,
      } = body;

      // Get service due date
      const serviceLastDate = await this.serviceItemService.serviceDueDate(
        new ObjectId(itemId),
        new ObjectId(requestedToUser)
      );

      const serviceRequestData = {
        requestedBy: new ObjectId(token.id),
        requestedToOrg: new ObjectId(requestedToOrg),
        requestedToUser: new ObjectId(requestedToUser),
        itemId: new ObjectId(itemId),
        requestedByOrg: new ObjectId(requestedByOrg),
        projectId,
        customQuestions,
        serviceDueDate: serviceLastDate.serviceDueDate,
        ...(sourceId && { sourceId, sourceType }),
      };

      let requestData;
      if (requestId) {
        await this.serviceRequestModel.updateOne(
          { _id: requestId },
          { $set: serviceRequestData }
        );
      } else {
        requestData = await this.serviceRequestModel.create(serviceRequestData);
      }

      const requestObjectId = new ObjectId(requestId || requestData?.id);

      const request = await this.serviceRequestModel.findOne({
        _id: requestObjectId,
      });

      return { message: "Saved successfully", request };
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
      let data :any  = await this.serviceRequestModel
        .findOne({ _id: id })
        .populate({
          path: "itemId",
          populate: [{ path: "platformItemId" }],
        })
        .populate("sourceId", "_id sub_total discount_amount grand_total")
        .lean();

      if (!data) throw new Error("Service request not found");

      const response =
        await this.serviceResponseService.getServiceResponseDetail(data._id);
      data["serviceResponse"] = response;

      await this.attachUserProfile(data, accessToken, "requestedBy", null);
      await this.attachUserProfile(
        data,
        accessToken,
        "requestedToUser",
        "Expert"
      );

      return { data };
    } catch (err) {
      throw err;
    }
  }

  // Helper function to attach user profile to a given field
  private async attachUserProfile(
    data: any,
    accessToken: string,
    field: string,
    role: string | null
  ) {
    const userId = data[field];
    if (userId) {
      const profileDetails = await this.helperService.getProfileById(
        [userId],
        accessToken,
        role
      );
      const userMap = profileDetails.reduce((acc, profile) => {
        acc[profile.userId] = profile;
        return acc;
      }, {});

      data[field] = userMap[userId];
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

  async getServiceRequestDetail(sourceId: string) {
    try {
      let data = await this.serviceRequestModel
        .findOne({ sourceId: sourceId })
        .populate({
          path: "itemId",
          populate: [
            {
              path: "platformItemId",
            },
          ],
        })
        .lean();
      // console.log("service request data", data);

      return { data: data };
    } catch (err) {
      throw err;
    }
  }

  async getCompletedServiceRequest(id: string, orgId: any) {


    try {
      let countData = await this.serviceRequestModel.countDocuments({
        requestedToUser: id,
        requestedToOrg: orgId,
        requestStatus: EServiceRequestStatus.completed,
      });
      return { count: countData };
    } catch (err) {
      throw err;
    }
  }
}
