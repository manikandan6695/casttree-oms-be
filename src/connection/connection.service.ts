import { UserToken } from "./../user/dto/usertoken.dto";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { SharedService } from "src/shared/shared.service";
import {
  EConnectionsStatus,
  EConnectionType,
  EDocStatus,
} from "./enum/connection.enum";
import { IConnectionModel } from "./schema/connection.schema";
import { IConnectionRequestModel } from "./schema/connectionRequest.schema";
import { IProfileModel } from "src/profile/schema/profile.schema";
import { EProfileVisibility } from "src/profile/enum/profile.enum";
import { EStatus } from "src/shared/enum/privacy.enum";
const { ObjectId } = require("mongodb");
@Injectable()
export class ConnectionService {
  constructor(
    @InjectModel("connection")
    private readonly connectionModel: Model<IConnectionModel>,
    @InjectModel("profile")
    private readonly profileModel: Model<IProfileModel>,
    @InjectModel("connectionRequest")
    private readonly connectionRequestModel: Model<IConnectionRequestModel>,
    private shared_service: SharedService
  ) {}

  async createConnectionRequest(body, token) {
    try {
      let profile = await this.profileModel.findOne({
        _id: body.receiverProfileId,
      });
      let data;
      if (profile.visibility != EProfileVisibility.public) {
        let fv = {
          ...body,
          requestorProfileId: token.profileId,
          requestStatus: "Pending",
          requestStatusHistory: ["Pending"],
          createdBy: token.id,
          updatedBy: token.id,
        };

        data = await this.connectionRequestModel.create(fv);
      } else {
        let fv = {
          ...body,
          requestorProfileId: token.profileId,
          requestStatus: EConnectionsStatus.approved,
          requestStatusHistory: [EConnectionsStatus.approved],
          createdBy: token.id,
          updatedBy: token.id,
        };

        await this.connectionRequestModel.create(fv);
        data = await this.connectionModel.create({
          requestorProfileId: token.profileId,
          receiverProfileId: body.receiverProfileId,
          type: body.type,
          connectionStatus: EConnectionsStatus.approved,
        });
      }
      return data;
    } catch (err) {
      throw err;
    }
  }

  async getConnectionStatusByIds(
    requestorProfileId: string,
    receiverProfileId: string
  ) {
    try {
      if (receiverProfileId != undefined && requestorProfileId != undefined) {
        if (requestorProfileId.toString() == receiverProfileId.toString()) {
          return { connectionId: null, requestStatus: null };
        }
      }
      let data = await this.connectionRequestModel
        .findOne({
          $or: [
            {
              $and: [
                { requestor_org_id: new ObjectId(requestorProfileId) },
                { receiverProfileId: new ObjectId(receiverProfileId) },
              ],
            },
            {
              $and: [
                { requestorProfileId: new ObjectId(receiverProfileId) },
                { receiverProfileId: new ObjectId(requestorProfileId) },
              ],
            },
          ],
        })
        .lean();

      if (data) {
        data = data;
      } else {
        data = await this.connectionModel
          .findOne({
            $or: [
              {
                $and: [
                  { requestorProfileId: new ObjectId(requestorProfileId) },
                  { receiverProfileId: receiverProfileId },
                ],
              },
              {
                $and: [
                  { requestorProfileId: receiverProfileId },
                  { receiverProfileId: new ObjectId(requestorProfileId) },
                ],
              },
            ],
          })
          .lean();
      }

      if (data) {
        return {
          connectionId: data._id,
          organization_id:
            data.receiverProfileId.toString() == requestorProfileId.toString()
              ? data.requestorProfileId
              : data.receiverProfileId,
          requestStatus: data?.["connectionStatus"] || data?.requestStatus,
          receiverProfileId: data.receiverProfileId.toString(),
          requestorProfileId: data.requestorProfileId.toString(),
        };
      } else {
        return {
          connectionId: null,
          requestStatus: EConnectionsStatus.not_connected,
        };
      }
    } catch (err) {
      throw err;
    }
  }

  async getConnectionRequestList(
    skip: number,
    limit: number,
    token: UserToken,
    type: string,
    requestType: string
  ) {
    try {
      console.log("token is", token);

      let filter = {};
      if (requestType == EConnectionType.received) {
        filter = {
          receiverProfileId: new ObjectId(token.profileId),
          requestStatus: EConnectionsStatus.pending,
          type: type,
        };
      }
      if (requestType == EConnectionType.sent) {
        filter = {
          requestorProfileId: token.profileId,
          requestStatus: EConnectionsStatus.pending,
          type: type,
        };
      }
      console.log("filter is", filter);

      let data = await this.connectionRequestModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .populate({
          path: "requestorProfileId",
          populate: [
            {
              path: "userId",
              select: { userName: 1, city: 1, state: 1, country: 1 },
              populate: [
                {
                  path: "city",
                  select: {
                    city_name: 1,
                  },
                },
                {
                  path: "state",
                  select: {
                    state_name: 1,
                  },
                },
                {
                  path: "country",
                  select: {
                    country_name: 1,
                  },
                },
              ],
            },
            {
              path: "roles",
              select: {
                category_name: 1,
                media: 1,
              },
              populate: [
                {
                  path: "media.media_id",
                  select: {
                    location: 1,
                  },
                },
              ],
            },
            {
              path: "media",
              populate: [
                {
                  path: "media.media_id",
                  select: {
                    location: 1,
                  },
                },
              ],
            },
          ],
        })
        .populate({
          path: "receiverProfileId",
          populate: [
            {
              path: "userId",
              select: { userName: 1, city: 1, state: 1 },
              populate: [
                {
                  path: "city",
                  select: {
                    city_name: 1,
                  },
                },
                {
                  path: "state",
                  select: {
                    state_name: 1,
                  },
                },
                {
                  path: "country",
                  select: {
                    country_name: 1,
                  },
                },
              ],
            },
            {
              path: "roles",
              select: {
                category_name: 1,
                media: 1,
              },
              populate: [
                {
                  path: "media.media_id",
                  select: {
                    location: 1,
                  },
                },
              ],
            },
            {
              path: "media",
              populate: [
                {
                  path: "media.media_id",
                  select: {
                    location: 1,
                  },
                },
              ],
            },
          ],
        });
      console.log("data is", data);

      return data;
    } catch (err) {
      throw err;
    }
  }

  async getConnections(skip, limit, token, type, requestedBy, receivedBy) {
    try {
      let filter = { status: EStatus.Active };
      if (requestedBy) {
        filter["requestorProfileId"] = requestedBy;
      }
      if (receivedBy) {
        filter["receiverProfileId"] = receivedBy;
      }
      console.log("filter is", filter);

      let data = await this.connectionModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .populate({
          path: "requestorProfileId",
          populate: [
            {
              path: "userId",
              select: { userName: 1, city: 1, state: 1 },
              populate: [
                {
                  path: "city",
                  select: {
                    city_name: 1,
                  },
                },
                {
                  path: "state",
                  select: {
                    state_name: 1,
                  },
                },
                {
                  path: "country",
                  select: {
                    country_name: 1,
                  },
                },
              ],
            },
            {
              path: "roles",
              select: {
                category_name: 1,
                media: 1,
              },
              populate: [
                {
                  path: "media.media_id",
                  select: {
                    location: 1,
                  },
                },
              ],
            },
            {
              path: "media",
              populate: [
                {
                  path: "media.media_id",
                  select: {
                    location: 1,
                  },
                },
              ],
            },
          ],
        })
        .populate({
          path: "receiverProfileId",
          populate: [
            {
              path: "userId",
              select: { userName: 1, city: 1, state: 1 },
              populate: [
                {
                  path: "city",
                  select: {
                    city_name: 1,
                  },
                },
                {
                  path: "state",
                  select: {
                    state_name: 1,
                  },
                },
                {
                  path: "country",
                  select: {
                    country_name: 1,
                  },
                },
              ],
            },
            {
              path: "roles",
              select: {
                category_name: 1,
                media: 1,
              },
              populate: [
                {
                  path: "media.media_id",
                  select: {
                    location: 1,
                  },
                },
              ],
            },
            {
              path: "media",
              populate: [
                {
                  path: "media.media_id",
                  select: {
                    location: 1,
                  },
                },
              ],
            },
          ],
        });

      return data;
    } catch (err) {
      throw err;
    }
  }

  async updateConnectionRequest(body, token) {
    try {
      console.log("requestId", body.requestId);

      let connection = await this.connectionRequestModel
        .findOne({
          _id: body.requestId,
        })
        .lean();
      let status = connection["requestStatus"];
      await this.connectionRequestModel.updateOne(
        { _id: body.requestId },
        {
          $set: {
            requestStatus: body.requestStatus,
            requestStatusHistory: [status, body.requestStatus],
          },
        }
      );

      if ((body.requestStatus = EConnectionsStatus.approved)) {
        await this.connectionModel.create({
          requestorProfileId: token.profileId,
          receiverProfileId: body.receiverProfileId,
          type: body.type,
          connectionStatus: body.requestStatus,
        });
      }

      return { message: "Updated Successfully" };
    } catch (err) {
      throw err;
    }
  }
  async getConnectionCount(profileId: string) {
    try {
      let followerCount = await this.connectionModel.countDocuments({
        receiverProfileId: new ObjectId(profileId),
        connectionStatus: EConnectionsStatus.approved,
      });

      let followingCount = await this.connectionModel.countDocuments({
        requestorProfileId: new ObjectId(profileId),
        connectionStatus: EConnectionsStatus.approved,
      });

      return { followerCount, followingCount };
    } catch (err) {
      throw err;
    }
  }

  async updateConnection(id: string, connectionStatus: any, token) {
    try {
      await this.connectionModel.updateOne(
        { _id: id },
        {
          $set: {
            connectionStatus: connectionStatus,
            status: EStatus.Inactive,
          },
        }
      );
      return { message: "Updated Successfully" };
    } catch (err) {
      throw err;
    }
  }
}
